#!/bin/bash
# Sync seed URLs (entry points) from fixtures/domains.json to the live crawler domain.
# Uses the Kibana internal Enterprise Search API.
# API: POST/DELETE {KIBANA_HOST}/internal/enterprise_search/indices/{INDEX}/crawler/domains/{DOMAIN_ID}/entry_points
set -euo pipefail

source "$(dirname "$0")/common.sh"

KIBANA_HOST=$(get_kibana_host)
DOMAINS_FILE="$FIXTURES_DIR/domains.json"

if [[ ! -f "$DOMAINS_FILE" ]]; then
  echo "ERROR: Domains fixture not found: $DOMAINS_FILE" >&2
  exit 1
fi

BASE_URL="${KIBANA_HOST}/internal/enterprise_search/indices/${INDEX_NAME}/crawler/domains/${DOMAIN_ID}"

# Read desired seed URLs from fixture (stored as full URLs, convert to paths)
python3 -c "
import json
with open('$DOMAINS_FILE') as f:
    data = json.load(f)
seeds = data[0]['_source']['seed_urls']
base = 'https://2e.aonprd.com'
paths = []
for s in seeds:
    url = s['url']
    path = url[len(base):] if url.startswith(base) else url
    paths.append(path if path else '/')
print(json.dumps(paths))
" > /tmp/desired_seed_urls.json

echo "Desired seed URLs from fixture:"
python3 -c "
import json
paths = json.load(open('/tmp/desired_seed_urls.json'))
for p in paths:
    print(f'  {p}')
print(f'Total: {len(paths)}')
"

# Fetch current entry_points from the live domain
echo
echo "Fetching current entry points from domain $DOMAIN_ID ..."
http_call GET "$BASE_URL" \
  "Authorization: ApiKey $ES_API_KEY" \
  -H "kbn-xsrf: true"

if [[ "$HTTP_STATUS" -ge 200 && "$HTTP_STATUS" -lt 300 ]]; then
  echo "$HTTP_BODY" > /tmp/current_domain.json
else
  echo "ERROR ($HTTP_STATUS): Could not fetch current domain." >&2
  echo "$HTTP_BODY" >&2
  exit 1
fi

# Compute which paths need to be added
python3 -c "
import json
desired_paths = json.load(open('/tmp/desired_seed_urls.json'))
current_data = json.load(open('/tmp/current_domain.json'))
current_eps = current_data.get('entry_points', [])
current_values = {ep['value'] for ep in current_eps}

to_add = [p for p in desired_paths if p not in current_values]

print(f'Current entry points: {len(current_values)}', flush=True)
print(f'Desired entry points: {len(desired_paths)}', flush=True)
print(f'To add: {len(to_add)}', flush=True)
print(f'Already present: {len(desired_paths) - len(to_add)}', flush=True)

with open('/tmp/seed_urls_to_add.json', 'w') as f:
    json.dump(to_add, f)
"

TO_ADD=$(cat /tmp/seed_urls_to_add.json)
COUNT=$(echo "$TO_ADD" | python3 -c "import json,sys; print(len(json.load(sys.stdin)))")

if [[ "$COUNT" -eq 0 ]]; then
  echo "All desired seed URLs are already present. Nothing to do."
  exit 0
fi

echo
echo "Adding $COUNT new seed URL(s) ..."

python3 -c "
import json
paths = json.load(open('/tmp/seed_urls_to_add.json'))
for p in paths:
    print(p)
" | while IFS= read -r path; do
  echo "  POST entry_point: $path"
  http_call POST \
    "${BASE_URL}/entry_points" \
    "Authorization: ApiKey $ES_API_KEY" \
    -H "kbn-xsrf: true" \
    -d "{\"value\": \"$path\"}"
  if [[ "$HTTP_STATUS" -ge 200 && "$HTTP_STATUS" -lt 300 ]]; then
    echo "  SUCCESS ($HTTP_STATUS)"
  else
    echo "  ERROR ($HTTP_STATUS): Failed to add entry point $path" >&2
    echo "  $HTTP_BODY" >&2
    exit 1
  fi
done

echo
echo "Done. Final entry points:"
http_call GET "$BASE_URL" \
  "Authorization: ApiKey $ES_API_KEY" \
  -H "kbn-xsrf: true"
python3 -c "
import json, sys
d = json.loads('$HTTP_BODY'.replace('$', '\$'))
" 2>/dev/null || python3 << 'PYEOF'
import json, sys

with open('/tmp/current_domain.json') as f:
    pass  # will re-read after update

PYEOF

# Re-fetch to show final state
http_call GET "$BASE_URL" \
  "Authorization: ApiKey $ES_API_KEY" \
  -H "kbn-xsrf: true"
echo "$HTTP_BODY" > /tmp/current_domain.json
python3 -c "
import json
d = json.load(open('/tmp/current_domain.json'))
eps = d.get('entry_points', [])
for ep in eps:
    print(f\"  {ep['value']}\")
print(f'Total: {len(eps)}')
"

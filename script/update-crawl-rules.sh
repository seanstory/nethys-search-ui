#!/bin/bash
# Sync crawl rules from fixtures/domains.json to the live crawler domain.
# Uses the Kibana internal Enterprise Search API.
# API: POST/DELETE {KIBANA_HOST}/internal/enterprise_search/indices/{INDEX}/crawler/domains/{DOMAIN_ID}/crawl_rules
set -euo pipefail

source "$(dirname "$0")/common.sh"

KIBANA_HOST=$(get_kibana_host)
DOMAINS_FILE="$FIXTURES_DIR/domains.json"

if [[ ! -f "$DOMAINS_FILE" ]]; then
  echo "ERROR: Domains fixture not found: $DOMAINS_FILE" >&2
  exit 1
fi

BASE_URL="${KIBANA_HOST}/internal/enterprise_search/indices/${INDEX_NAME}/crawler/domains/${DOMAIN_ID}"

# Read desired rules from fixture
DESIRED_RULES=$(python3 -c "
import json, sys
with open('$DOMAINS_FILE') as f:
    data = json.load(f)
rules = data[0]['_source']['crawl_rules']
print(json.dumps(rules))
")

echo "Desired crawl rules from fixture:"
echo "$DESIRED_RULES" | python3 -m json.tool

# Fetch current rules from the live domain
echo
echo "Fetching current crawl rules from domain $DOMAIN_ID ..."
http_call GET "$BASE_URL" \
  "Authorization: ApiKey $ES_API_KEY" \
  -H "kbn-xsrf: true"

if [[ "$HTTP_STATUS" -ge 200 && "$HTTP_STATUS" -lt 300 ]]; then
  CURRENT_RULES=$(echo "$HTTP_BODY" | python3 -c "
import json, sys
d = json.load(sys.stdin)
print(json.dumps(d.get('crawl_rules', [])))
")
  echo "Current crawl rules on server:"
  echo "$CURRENT_RULES" | python3 -m json.tool
else
  echo "ERROR ($HTTP_STATUS): Could not fetch current domain." >&2
  echo "$HTTP_BODY" >&2
  exit 1
fi

# Create rules that are in fixture but not on server (match by policy+rule+pattern)
python3 - "$CURRENT_RULES" "$DESIRED_RULES" <<'PYEOF'
import json, sys

current = json.loads(sys.argv[1])
desired = json.loads(sys.argv[2])

def rule_key(r):
    return (r['policy'], r['rule'], r['pattern'])

current_keys = {rule_key(r) for r in current}
to_add = [r for r in desired if rule_key(r) not in current_keys]

with open('/tmp/crawl_rules_to_add.json', 'w') as f:
    json.dump(to_add, f)
print(f"Rules to add: {len(to_add)}, already present: {len(desired) - len(to_add)}")
PYEOF

TO_ADD=$(cat /tmp/crawl_rules_to_add.json)
COUNT=$(echo "$TO_ADD" | python3 -c "import json,sys; print(len(json.load(sys.stdin)))")

if [[ "$COUNT" -eq 0 ]]; then
  echo "All desired crawl rules are already present. Nothing to do."
  exit 0
fi

echo
echo "Creating $COUNT crawl rule(s) ..."

echo "$TO_ADD" | python3 -c "
import json, sys
rules = json.load(sys.stdin)
for r in rules:
    print(json.dumps({'policy': r['policy'], 'rule': r['rule'], 'pattern': r['pattern']}))
" | while IFS= read -r rule_json; do
  echo "  POST $rule_json"
  http_call POST \
    "${BASE_URL}/crawl_rules" \
    "Authorization: ApiKey $ES_API_KEY" \
    -H "kbn-xsrf: true" \
    -d "$rule_json"
  if [[ "$HTTP_STATUS" -ge 200 && "$HTTP_STATUS" -lt 300 ]]; then
    echo "  SUCCESS ($HTTP_STATUS): Rule created."
  else
    echo "  ERROR ($HTTP_STATUS): Failed to create rule." >&2
    echo "  $HTTP_BODY" >&2
    exit 1
  fi
done

echo
echo "Done. Final crawl rules on domain:"
http_call GET "$BASE_URL" \
  "Authorization: ApiKey $ES_API_KEY" \
  -H "kbn-xsrf: true"
echo "$HTTP_BODY" | python3 -c "
import json, sys
d = json.load(sys.stdin)
print(json.dumps(d.get('crawl_rules', []), indent=2))
"

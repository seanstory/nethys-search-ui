#!/bin/bash
# Push extraction rules from fixtures/extraction_rules.json to Elasticsearch.
# The extraction rules index is managed by the Elastic crawler internally;
# there is no public API, so we write directly to the backing ES index.
set -euo pipefail

source "$(dirname "$0")/common.sh"

ES_HOST=$(get_es_host)
RULES_FILE="$FIXTURES_DIR/extraction_rules.json"
RULES_INDEX=".ent-search-actastic-crawler2_extraction_rules"

if [[ ! -f "$RULES_FILE" ]]; then
  echo "ERROR: Extraction rules fixture not found: $RULES_FILE" >&2
  exit 1
fi

# Parse rule count and IDs from fixture
RULE_COUNT=$(python3 -c "import json,sys; d=json.load(open('$RULES_FILE')); print(len(d))")
echo "Updating $RULE_COUNT extraction rule(s) on $ES_HOST ..."
echo

python3 - "$RULES_FILE" "$ES_HOST" "$RULES_INDEX" "$ES_API_KEY" <<'PYEOF'
import json, sys, urllib.request, urllib.error
from datetime import datetime, timezone

rules_file, es_host, rules_index, api_key = sys.argv[1:]

with open(rules_file) as f:
    rules = json.load(f)

errors = []
for entry in rules:
    doc_id = entry["_id"]
    source = entry["_source"]
    description = source.get("description", doc_id)

    payload = {"doc": {**source, "updated_at": datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")}}
    body = json.dumps(payload).encode()

    url = f"{es_host}/{rules_index}/_update/{doc_id}"
    req = urllib.request.Request(url, data=body, method="POST", headers={
        "Authorization": f"ApiKey {api_key}",
        "Content-Type": "application/json",
    })
    try:
        with urllib.request.urlopen(req) as resp:
            result = json.load(resp)
            print(f"  OK  [{result['result']}] {description}")
    except urllib.error.HTTPError as e:
        err = e.read().decode()
        print(f"  ERR {description}: {err}", file=sys.stderr)
        errors.append(description)

print()
if errors:
    print(f"FAILED: {len(errors)} rule(s) not updated:", file=sys.stderr)
    for e in errors:
        print(f"  - {e}", file=sys.stderr)
    sys.exit(1)
else:
    print(f"SUCCESS: all {len(rules)} rule(s) updated.")
    print("Changes take effect on the next crawl (no restart needed).")
PYEOF

#!/bin/bash
# Sync curations (pinned/hidden results) from fixtures/curations.json to App Search.
#
# Promoted/hidden entries are stored as URLs in the fixture; this script resolves
# them to current document IDs via Elasticsearch before applying. This means the
# fixture survives a full re-index (doc IDs change, URLs don't).
#
# Safe to re-run: creates curations that don't exist, updates ones that do.
# Exits with an error if any URL cannot be resolved (e.g. page not yet crawled).
set -euo pipefail

source "$(dirname "$0")/common.sh"

ES_HOST=$(get_es_host)
AS_AUTH="Authorization: Bearer $ENT_SEARCH_PRIVATE_KEY"
ES_AUTH="Authorization: ApiKey $ES_API_KEY"

FIXTURE="$(dirname "$0")/fixtures/curations.json"

NUM_FIXTURE=$(python3 -c "import json; print(len(json.load(open('$FIXTURE'))))")
echo "Syncing $NUM_FIXTURE curation(s) for engine '$ENGINE_NAME' ..."
echo

# Fetch existing curations once so we can update vs create
http_call GET "${ENT_SEARCH_ENDPOINT}/api/as/v1/engines/${ENGINE_NAME}/curations?page%5Bsize%5D=100" "$AS_AUTH"
EXISTING_JSON="$HTTP_BODY"

for i in $(python3 -c "import json; print(*range(len(json.load(open('$FIXTURE')))))" ); do
  QUERIES_JSON=$(python3 -c "import json; print(json.dumps(json.load(open('$FIXTURE'))[$i]['queries']))")
  PROMOTED_URLS=()
  while IFS= read -r line; do PROMOTED_URLS+=("$line"); done < <(python3 -c "import json; [print(u) for u in json.load(open('$FIXTURE'))[$i].get('promoted_urls', [])]")
  HIDDEN_URLS=()
  while IFS= read -r line; do HIDDEN_URLS+=("$line"); done < <(python3 -c "import json; [print(u) for u in json.load(open('$FIXTURE'))[$i].get('hidden_urls', [])]")

  echo "Curation for queries: $QUERIES_JSON"

  # Resolve each promoted URL to its current doc ID
  PROMOTED_IDS=()
  for url in "${PROMOTED_URLS[@]:-}"; do
    [[ -z "$url" ]] && continue
    http_call POST "${ES_HOST}/${INDEX_NAME}/_search" "$ES_AUTH" \
      -d "{\"query\":{\"term\":{\"url\":\"${url}\"}},\"size\":1,\"_source\":false}"
    doc_id=$(echo "$HTTP_BODY" | python3 -c "
import json, sys
hits = json.load(sys.stdin)['hits']['hits']
if not hits:
    print('ERROR: no document found for URL: ${url}', file=sys.stderr)
    sys.exit(1)
print(hits[0]['_id'])
")
    echo "  $url -> $doc_id"
    PROMOTED_IDS+=("\"$doc_id\"")
  done

  # Resolve each hidden URL to its current doc ID
  HIDDEN_IDS=()
  for url in "${HIDDEN_URLS[@]:-}"; do
    [[ -z "$url" ]] && continue
    http_call POST "${ES_HOST}/${INDEX_NAME}/_search" "$ES_AUTH" \
      -d "{\"query\":{\"term\":{\"url\":\"${url}\"}},\"size\":1,\"_source\":false}"
    doc_id=$(echo "$HTTP_BODY" | python3 -c "
import json, sys
hits = json.load(sys.stdin)['hits']['hits']
if not hits:
    print('ERROR: no document found for URL: ${url}', file=sys.stderr)
    sys.exit(1)
print(hits[0]['_id'])
")
    echo "  (hidden) $url -> $doc_id"
    HIDDEN_IDS+=("\"$doc_id\"")
  done

  PROMOTED_ARR=$(IFS=,; echo "[${PROMOTED_IDS[*]:-}]")
  HIDDEN_ARR=$(IFS=,;   echo "[${HIDDEN_IDS[*]:-}]")
  BODY="{\"queries\":${QUERIES_JSON},\"promoted\":${PROMOTED_ARR},\"hidden\":${HIDDEN_ARR}}"

  # Find existing curation ID for these queries, if any
  EXISTING_ID=$(echo "$EXISTING_JSON" | python3 -c "
import json, sys
queries = json.loads('$QUERIES_JSON')
for r in json.load(sys.stdin)['results']:
    if r['queries'] == queries:
        print(r['id'])
        break
")

  if [[ -n "$EXISTING_ID" ]]; then
    echo "  Updating existing curation $EXISTING_ID ..."
    http_call PUT "${ENT_SEARCH_ENDPOINT}/api/as/v1/engines/${ENGINE_NAME}/curations/${EXISTING_ID}" \
      "$AS_AUTH" -d "$BODY"
  else
    echo "  Creating new curation ..."
    http_call POST "${ENT_SEARCH_ENDPOINT}/api/as/v1/engines/${ENGINE_NAME}/curations" \
      "$AS_AUTH" -d "$BODY"
  fi

  if [[ "$HTTP_STATUS" -ge 200 && "$HTTP_STATUS" -lt 300 ]]; then
    echo "  SUCCESS ($HTTP_STATUS)"
  else
    echo "  ERROR ($HTTP_STATUS): $HTTP_BODY" >&2
    exit 1
  fi
  echo
done

echo "Done."

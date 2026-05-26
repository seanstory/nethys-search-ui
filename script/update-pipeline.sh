#!/bin/bash
# Push the ingest pipeline from fixtures/pipeline.json to Elasticsearch.
# API: PUT {ES_HOST}/_ingest/pipeline/{PIPELINE_NAME}
set -euo pipefail

source "$(dirname "$0")/common.sh"

ES_HOST=$(get_es_host)
PIPELINE_FILE="$FIXTURES_DIR/pipeline.json"

if [[ ! -f "$PIPELINE_FILE" ]]; then
  echo "ERROR: Pipeline fixture not found: $PIPELINE_FILE" >&2
  exit 1
fi

echo "Updating pipeline '$PIPELINE_NAME' on $ES_HOST ..."

http_call PUT \
  "${ES_HOST}/_ingest/pipeline/${PIPELINE_NAME}" \
  "Authorization: ApiKey $ES_API_KEY" \
  --data-binary "@$PIPELINE_FILE"

if [[ "$HTTP_STATUS" -ge 200 && "$HTTP_STATUS" -lt 300 ]]; then
  echo "SUCCESS ($HTTP_STATUS): Pipeline updated."
else
  echo "ERROR ($HTTP_STATUS): Failed to update pipeline." >&2
  echo "$HTTP_BODY" >&2
  exit 1
fi

echo
echo "Verifying — fetching first processor from pipeline ..."
http_call GET \
  "${ES_HOST}/_ingest/pipeline/${PIPELINE_NAME}" \
  "Authorization: ApiKey $ES_API_KEY"

if command -v jq &>/dev/null; then
  echo "$HTTP_BODY" | jq --arg name "$PIPELINE_NAME" '.[$name].processors[0]'
else
  echo "$HTTP_BODY" | python3 -c "
import json, sys
d = json.load(sys.stdin)
key = list(d.keys())[0]
print(json.dumps(d[key]['processors'][0], indent=2))
"
fi

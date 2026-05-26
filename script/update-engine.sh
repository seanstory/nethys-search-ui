#!/bin/bash
# Push engine search settings from fixtures/engine.json to App Search.
# API: PUT {ENT_SEARCH_ENDPOINT}/api/as/v1/engines/{ENGINE}/search_settings
set -euo pipefail

source "$(dirname "$0")/common.sh"

ENGINE_FILE="$FIXTURES_DIR/engine.json"

if [[ ! -f "$ENGINE_FILE" ]]; then
  echo "ERROR: Engine fixture not found: $ENGINE_FILE" >&2
  exit 1
fi

# Extract search_setting[0] from the fixture
SETTINGS=$(python3 -c "
import json, sys
with open('$ENGINE_FILE') as f:
    data = json.load(f)
settings = data['_source']['search_setting'][0]
print(json.dumps(settings))
")

echo "Updating search settings for engine '$ENGINE_NAME' ..."
echo "Settings to apply:"
echo "$SETTINGS" | python3 -m json.tool

http_call PUT \
  "${ENT_SEARCH_ENDPOINT}/api/as/v1/engines/${ENGINE_NAME}/search_settings" \
  "Authorization: Bearer $ENT_SEARCH_PRIVATE_KEY" \
  -d "$SETTINGS"

if [[ "$HTTP_STATUS" -ge 200 && "$HTTP_STATUS" -lt 300 ]]; then
  echo "SUCCESS ($HTTP_STATUS): Search settings updated."
else
  echo "ERROR ($HTTP_STATUS): Failed to update search settings." >&2
  echo "$HTTP_BODY" >&2
  exit 1
fi

#!/bin/bash
# Trigger a new full crawl via the Kibana internal Enterprise Search API.
# API: POST {KIBANA_HOST}/internal/enterprise_search/indices/{INDEX}/crawler/crawl_requests
set -euo pipefail

source "$(dirname "$0")/common.sh"

KIBANA_HOST=$(get_kibana_host)
URL="${KIBANA_HOST}/internal/enterprise_search/indices/${INDEX_NAME}/crawler/crawl_requests"

echo "Triggering full crawl for index '$INDEX_NAME' ..."

http_call POST "$URL" \
  "Authorization: ApiKey $ES_API_KEY" \
  -H "kbn-xsrf: true" \
  -d '{}'

if [[ "$HTTP_STATUS" -ge 200 && "$HTTP_STATUS" -lt 300 ]]; then
  echo "SUCCESS ($HTTP_STATUS): Crawl triggered."
  echo "$HTTP_BODY" | python3 -m json.tool
else
  echo "ERROR ($HTTP_STATUS): Failed to trigger crawl." >&2
  echo "$HTTP_BODY" >&2
  exit 1
fi

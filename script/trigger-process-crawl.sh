#!/bin/bash
# Trigger a "process crawl" — re-applies crawl rules to all already-indexed documents
# and deletes any whose URLs now match a deny rule. Run this after updating crawl rules
# to purge previously-indexed documents that match the new deny rules.
#
# This is faster and safer than delete-dead-links.sh because it goes through the
# crawler's own deduplication and processing logic rather than a direct _delete_by_query.
#
# API: POST {KIBANA_HOST}/internal/enterprise_search/indices/{INDEX}/crawler/process_crawls
set -euo pipefail

source "$(dirname "$0")/common.sh"

KIBANA_HOST=$(get_kibana_host)
URL="${KIBANA_HOST}/internal/enterprise_search/indices/${INDEX_NAME}/crawler/process_crawls"

echo "Triggering process crawl for index '$INDEX_NAME' ..."
echo "(This re-applies crawl rules and removes documents matching deny rules.)"

http_call POST "$URL" \
  "Authorization: ApiKey $ES_API_KEY" \
  -H "kbn-xsrf: true" \
  -d '{}'

if [[ "$HTTP_STATUS" -ge 200 && "$HTTP_STATUS" -lt 300 ]]; then
  echo "SUCCESS ($HTTP_STATUS): Process crawl triggered."
  echo "$HTTP_BODY" | python3 -m json.tool
else
  echo "ERROR ($HTTP_STATUS): Failed to trigger process crawl." >&2
  echo "$HTTP_BODY" >&2
  exit 1
fi

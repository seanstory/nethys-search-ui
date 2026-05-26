#!/bin/bash
# One-time cleanup: delete all documents with session-token URLs from the index.
# These were indexed before crawl rules were added and will not be re-crawled once
# the deny rules are in place.
#
# IMPORTANT: Run check-dead-links.sh first to see what will be deleted.
# This is a destructive operation — documents are permanently removed from the index.
# They will be re-indexed with correct URLs on the next full crawl.
#
# Usage:
#   ./delete-dead-links.sh          # dry run (shows count, no deletion)
#   ./delete-dead-links.sh --confirm  # actually deletes
set -euo pipefail

source "$(dirname "$0")/common.sh"

ES_HOST=$(get_es_host)
AUTH="Authorization: ApiKey $ES_API_KEY"

QUERY='{"query":{"wildcard":{"url":"*)S(*"}}}'

DRY_RUN=true
if [[ "${1:-}" == "--confirm" ]]; then
  DRY_RUN=false
fi

# Count first
http_call POST "${ES_HOST}/${INDEX_NAME}/_count" "$AUTH" -d "$QUERY"
COUNT=$(echo "$HTTP_BODY" | python3 -c "import json,sys; print(json.load(sys.stdin)['count'])")
echo "Documents matching session-token URL pattern: $COUNT"

if [[ "$DRY_RUN" == "true" ]]; then
  echo
  echo "DRY RUN — no documents deleted."
  echo "Re-run with --confirm to permanently delete these $COUNT documents."
  exit 0
fi

echo
echo "Deleting $COUNT documents ..."
http_call POST "${ES_HOST}/${INDEX_NAME}/_delete_by_query" "$AUTH" \
  -d "$QUERY"

if [[ "$HTTP_STATUS" -ge 200 && "$HTTP_STATUS" -lt 300 ]]; then
  DELETED=$(echo "$HTTP_BODY" | python3 -c "import json,sys; print(json.load(sys.stdin).get('deleted', 0))")
  echo "SUCCESS: Deleted $DELETED documents."
else
  echo "ERROR ($HTTP_STATUS): Deletion failed." >&2
  echo "$HTTP_BODY" >&2
  exit 1
fi

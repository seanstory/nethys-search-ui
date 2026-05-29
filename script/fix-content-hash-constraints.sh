#!/bin/bash
# Fix: delete orphaned content_hash unique constraint entries.
#
# The crawler uses a unique constraint index to prevent duplicate documents with
# the same content hash. When documents are deleted from the content_metadata
# index (e.g., after a full re-index), the constraint entries are NOT cleaned up.
# These orphaned locks prevent the crawler from indexing updated versions of pages
# whose content has changed, producing "not unique value for field
# configuration_oid, content_hash" errors in the crawler logs.
#
# This script identifies and deletes constraint entries that point to document IDs
# no longer present in the content_metadata index.
#
# Safe to run while crawls are in progress, but ideally run when no crawl is active.
# After running, trigger a full crawl to re-index previously blocked pages.
set -euo pipefail

source "$(dirname "$0")/common.sh"

ES_HOST=$(get_es_host)
AUTH="Authorization: ApiKey $ES_API_KEY"
CONSTRAINT_INDEX=".ent-search-actastic-crawler2_content_metadata-configuration_oid-content_hash-unique-constraint"
METADATA_INDEX=".ent-search-actastic-crawler2_content_metadata"

echo "=== Content Hash Constraint Cleanup ==="
echo

# Count before
http_call GET "${ES_HOST}/${CONSTRAINT_INDEX}/_count" "$AUTH"
BEFORE=$(echo "$HTTP_BODY" | python3 -c "import json,sys; print(json.load(sys.stdin)['count'])")
http_call GET "${ES_HOST}/${METADATA_INDEX}/_count" "$AUTH"
META_COUNT=$(echo "$HTTP_BODY" | python3 -c "import json,sys; print(json.load(sys.stdin)['count'])")

echo "Constraint entries: $BEFORE"
echo "Content metadata docs: $META_COUNT"
echo

# Get all valid document ID prefixes from content_metadata
# Each content_metadata doc has an 'id' field like:
#   "configuration_oid:...|document_id:<hex_id>"
# Constraint entries reference these via crawler2_content_metadatum_id.
# We get all current content_metadata IDs and delete constraint entries
# that don't reference any of them.

echo "Fetching valid document IDs from content_metadata..."
http_call POST "${ES_HOST}/${METADATA_INDEX}/_search" "$AUTH" \
  -d "{\"size\": 10000, \"_source\": [\"id\"]}"

VALID_IDS=$(echo "$HTTP_BODY" | python3 -c "
import json, sys
data = json.load(sys.stdin)
hits = data['hits']['hits']
ids = []
for h in hits:
    raw_id = h['_source']['id']
    # Extract just the document_id part
    if 'document_id:' in raw_id:
        doc_id = raw_id.split('document_id:')[1]
        ids.append(doc_id)
print(json.dumps(ids))
")

VALID_COUNT=$(echo "$VALID_IDS" | python3 -c "import json,sys; print(len(json.load(sys.stdin)))")
echo "Valid document IDs: $VALID_COUNT"

# Build a terms query to match valid constraint entries
# Delete all constraint entries NOT in this list
DELETE_QUERY=$(echo "$VALID_IDS" | python3 -c "
import json, sys
ids = json.load(sys.stdin)
# Build must_not terms query — constraint entries whose metadatum_id contains one of the valid doc IDs
# Since IDs are hex strings, we can use a wildcard per ID (slow but correct for small sets)
# For large sets, use terms on a keyword field or regexp
# The crawler2_content_metadatum_id field looks like:
#   'configuration_oid:<oid>|document_id:<doc_id>'
# We want to DELETE entries where no valid doc_id appears
should_clauses = [{'wildcard': {'crawler2_content_metadatum_id': f'*{doc_id}'}} for doc_id in ids]
query = {
    'query': {
        'bool': {
            'must_not': [
                {'bool': {'should': should_clauses, 'minimum_should_match': 1}}
            ]
        }
    }
}
print(json.dumps(query))
")

# Count orphaned entries first
http_call POST "${ES_HOST}/${CONSTRAINT_INDEX}/_count" "$AUTH" -d "$DELETE_QUERY"
ORPHANED=$(echo "$HTTP_BODY" | python3 -c "import json,sys; print(json.load(sys.stdin)['count'])")
echo "Orphaned constraint entries to delete: $ORPHANED"

if [[ "$ORPHANED" -eq 0 ]]; then
  echo "No orphaned entries found. Nothing to do."
  exit 0
fi

if [[ "${1:-}" != "--confirm" ]]; then
  echo
  echo "Dry run complete. To actually delete, run with --confirm"
  exit 0
fi

echo
echo "Deleting $ORPHANED orphaned constraint entries..."
http_call POST "${ES_HOST}/${CONSTRAINT_INDEX}/_delete_by_query" "$AUTH" -d "$DELETE_QUERY"
DELETED=$(echo "$HTTP_BODY" | python3 -c "import json,sys; d=json.load(sys.stdin); print(d.get('deleted', 0))")
FAILURES=$(echo "$HTTP_BODY" | python3 -c "import json,sys; d=json.load(sys.stdin); print(len(d.get('failures', [])))")

echo "Deleted: $DELETED"
echo "Failures: $FAILURES"

# Refresh and report final counts
curl -s -H "$AUTH" -X POST "${ES_HOST}/${CONSTRAINT_INDEX}/_refresh" > /dev/null
http_call GET "${ES_HOST}/${CONSTRAINT_INDEX}/_count" "$AUTH"
AFTER=$(echo "$HTTP_BODY" | python3 -c "import json,sys; print(json.load(sys.stdin)['count'])")

echo
echo "=== Done ==="
echo "Constraint entries before: $BEFORE"
echo "Constraint entries after:  $AFTER"
echo
echo "Trigger a full crawl to re-index previously blocked pages:"
echo "  script/trigger-crawl.sh"

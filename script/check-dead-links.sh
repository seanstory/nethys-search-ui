#!/bin/bash
# Diagnostic: report counts and sample URLs for known dead-link patterns.
# Run before and after applying fixes to measure improvement.
set -euo pipefail

source "$(dirname "$0")/common.sh"

ES_HOST=$(get_es_host)
BASE="${ES_HOST}/${INDEX_NAME}/_search"
AUTH="Authorization: ApiKey $ES_API_KEY"

echo "=== Dead Link Diagnostics for index '$INDEX_NAME' ==="
echo

# Total document count
http_call GET "${ES_HOST}/${INDEX_NAME}/_count" "$AUTH"
TOTAL=$(echo "$HTTP_BODY" | python3 -c "import json,sys; print(json.load(sys.stdin)['count'])")
echo "Total documents: $TOTAL"
echo

# Session-token URLs (the main issue)
SESSION_QUERY='{"query":{"wildcard":{"url":"*)S(*"}},"size":5,"_source":["title","url"]}'
http_call POST "$BASE" "$AUTH" -d "$SESSION_QUERY"
SESSION_COUNT=$(echo "$HTTP_BODY" | python3 -c "import json,sys; print(json.load(sys.stdin)['hits']['total']['value'])")
echo "Documents with session-token URLs (*)S(*): $SESSION_COUNT"
if [[ "$SESSION_COUNT" -gt 0 ]]; then
  echo "Sample URLs:"
  echo "$HTTP_BODY" | python3 -c "
import json, sys
hits = json.load(sys.stdin)['hits']['hits']
for h in hits:
    print(f'  [{h[\"_source\"][\"title\"]}] {h[\"_source\"][\"url\"]}')
"
fi
echo

# Page Not Found titles
PNF_QUERY='{"query":{"wildcard":{"title.enum":"*Page Not Found*"}},"size":5,"_source":["title","url"]}'
http_call POST "$BASE" "$AUTH" -d "$PNF_QUERY"
PNF_COUNT=$(echo "$HTTP_BODY" | python3 -c "import json,sys; print(json.load(sys.stdin)['hits']['total']['value'])")
echo "Documents with 'Page Not Found' in title: $PNF_COUNT"
if [[ "$PNF_COUNT" -gt 0 ]]; then
  echo "Sample URLs:"
  echo "$HTTP_BODY" | python3 -c "
import json, sys
hits = json.load(sys.stdin)['hits']['hits']
for h in hits:
    print(f'  [{h[\"_source\"][\"title\"]}] {h[\"_source\"][\"url\"]}')
"
fi
echo

# content_url_metadata record count (healthy baseline: ~57K; growth toward 100K+ warrants investigation)
http_call GET "${ES_HOST}/.ent-search-actastic-crawler2_content_url_metadata/_count" "$AUTH"
URL_META_COUNT=$(echo "$HTTP_BODY" | python3 -c "import json,sys; print(json.load(sys.stdin)['count'])")
echo "Crawler URL metadata records: $URL_META_COUNT"
if [[ "$URL_META_COUNT" -gt 200000 ]]; then
  echo "WARNING: content_url_metadata is large ($URL_META_COUNT records) — may cause crawl scroll timeouts"
fi
echo

echo "=== Summary ==="
echo "  Total documents:            $TOTAL"
echo "  Session-token URL docs:     $SESSION_COUNT"
echo "  Page Not Found title docs:  $PNF_COUNT"
echo "  URL metadata records:       $URL_META_COUNT"

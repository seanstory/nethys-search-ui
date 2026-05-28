# Gotcha: App Search facets on new fields

**Test the App Search facet API before doing a full batch crawl.** The engine is ES-backed and has a constraint: it cannot facet on `boolean` fields, only `text`/`keyword`. If you store a flag as `boolean` (Python `True` or Painless `true`), it gets that mapping and you're stuck — ES won't let you re-map the field type. Use string values like `"yes"` so the field maps as `keyword`.

```bash
# Quick check before committing to a full batch crawl:
source script/common.sh
curl -s -H "Authorization: Bearer $ENT_SEARCH_PRIVATE_KEY" \
  -H "Content-Type: application/json" \
  "${ENT_SEARCH_ENDPOINT}/api/as/v1/engines/nethys/search" -d '{
    "query": "",
    "facets": {"<new_field>": {"type": "value", "size": 5}},
    "page": {"size": 1}
  }' | python3 -m json.tool
```

If the response contains `"Facets field cannot facet on <field>"`, the field type is wrong.

ES field types cannot be changed after the first document is indexed with that type. If you get it wrong, you need a new field name — there is no way to re-map an existing field.

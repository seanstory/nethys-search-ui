---
name: work-github-issue
description: Work a GitHub issue for the Nethys Search UI — investigate, fix, deploy backend changes, test via crawl + App Search API, and verify.
args: <github-issue-url-or-number>
---

# Work a Nethys Search UI GitHub Issue

End-to-end workflow: read the issue, investigate, implement a fix, deploy it, crawl affected pages, and verify through the App Search search API.

## Gotchas

Read the relevant gotcha file **before** starting work in that area. Paths are relative to this skill's directory (`.claude/skills/work-github-issue/`).

| When you're...                        | Read                                   |
|---------------------------------------|----------------------------------------|
| Writing or modifying grok patterns    | `gotchas/pipeline-grok.md`             |
| Matching against `full_html`          | `gotchas/crawler-html-normalization.md` |
| Adding a new facet field              | `gotchas/app-search-facets.md`         |
| Running a batch crawl (100+ pages)    | `gotchas/batch-crawl-timing.md`        |

## 1. Understand the issue

```bash
gh issue view <number>
```

Read the issue description, screenshots, and comments. Identify:
- Which **layer** is affected: frontend (React/Search UI), backend (ingest pipeline, extraction rules, crawl rules, engine settings, curations), or both.
- Which **category of content** is affected (Classes, Spells, Feats, Equipment, etc.).
- What the **expected** vs **actual** behavior is.

## 2. Investigate current state

Query Elasticsearch directly to see what's in the index today. Source `.env` via `script/common.sh` for credentials and helper functions (`get_es_host`, `get_kibana_host`, `http_call`, `jq_or_python`).

```bash
source script/common.sh
ES_HOST=$(get_es_host)
# Example: check what fields a category of documents has
curl -s -H "Authorization: ApiKey $ES_API_KEY" -H "Content-Type: application/json" \
  "${ES_HOST}/search-nethys/_search" -d '{...}' | jq .
```

If the issue involves content extraction or HTML structure, fetch the live Nethys page with `curl` and inspect the raw HTML to understand what the crawler sees.

### Querying the index directly

App Search manages the index mapping. All text fields have a `.enum` keyword subfield that supports exact-match `term` queries and `terms` aggregations. Use `category.enum` (not `category`) for filtering and aggregating by category. The bare `category` field is analyzed text — `term` queries on it silently return zero hits and aggregations fail with a fielddata error.

### Key backend artifacts (fixtures are source of truth)

| Fixture | What it controls | Deploy script |
|---|---|---|
| `script/fixtures/pipeline.json` | Ingest pipeline processors (field extraction, transforms, cleanup) | `script/update-pipeline.sh` |
| `script/fixtures/extraction_rules.json` | Crawler CSS extraction rules (traits, body, title, subtitle) | `script/update-extraction-rules.sh` |
| `script/fixtures/domains.json` | Crawl rules, seed URLs, deduplication settings | `script/update-crawl-rules.sh` |
| `script/fixtures/engine.json` | App Search engine settings (relevance tuning, synonyms) | `script/update-engine.sh` |
| `script/fixtures/curations.json` | Pinned/hidden search results (stored as URLs, resolved to doc IDs at deploy time) | `script/update-curations.sh` |

## 3. Implement the fix

Edit the appropriate fixture file(s). Common patterns:

- **Pipeline fix**: Add/modify processors in `pipeline.json`. Use `remove` with an `if` condition to strip fields from specific page types. Use `grok` or `gsub` for extraction/transformation. **Read `gotchas/pipeline-grok.md` first.**
- **Crawl rule fix**: Edit `domains.json` to add deny/allow rules.
- **Frontend fix**: Edit `src/App.tsx` (config, facets) or `src/components/CustomResultView.tsx` (result display). Adding a facet requires three edits: `facets` config, `conditionalFacets` config, and the `<Facet>` JSX in `sideContent`.

## 4. Deploy backend changes

Run the appropriate deploy script(s). All scripts source `.env` automatically:

```bash
script/update-pipeline.sh          # Push pipeline changes
script/update-crawl-rules.sh       # Push crawl rule changes
script/update-engine.sh            # Push engine setting changes
script/update-extraction-rules.sh  # Push CSS extraction rule changes
script/update-curations.sh         # Push curation changes (run after crawl)
```

## 5. Test with a targeted crawl

**Before triggering any crawl, check if one is already running:**

```bash
source script/common.sh
KIBANA_HOST=$(get_kibana_host)
curl -s -H "Authorization: ApiKey $ES_API_KEY" -H "kbn-xsrf: true" \
  "${KIBANA_HOST}/internal/enterprise_search/indices/search-nethys/crawler/crawl_requests/active" \
  | jq '{id, status}'
```

If an active crawl exists, **do not trigger another one**. Only one crawl can run at a time, and crawls take hours. Note that a crawl is running and skip to step 6 (verify using documents already in the index, or defer verification).

If no active crawl, trigger a **partial crawl** with custom seed URLs targeting only the affected pages. This re-indexes just those pages through the updated pipeline without running a full crawl (~57K pages).

```bash
curl -s -H "Authorization: ApiKey $ES_API_KEY" \
  -H "kbn-xsrf: true" -H "Content-Type: application/json" \
  "${KIBANA_HOST}/internal/enterprise_search/indices/search-nethys/crawler/crawl_requests" \
  -X POST -d '{
    "overrides": {
      "seed_urls": ["https://2e.aonprd.com/<PageType>.aspx?ID=<id>"],
      "max_crawl_depth": 1
    }
  }'
```

**`max_crawl_depth` minimum is 1** — the API rejects 0. Use `1` for leaf-page-only crawls.

This returns a crawl request ID. Poll for completion:

```bash
curl -s -H "Authorization: ApiKey $ES_API_KEY" -H "kbn-xsrf: true" \
  "${KIBANA_HOST}/internal/enterprise_search/indices/search-nethys/crawler/crawl_requests/<crawl_id>" \
  | jq '{status, completed_at}'
```

Targeted crawls (1-10 pages) typically complete in under 10 seconds.

## 6. Verify the fix

### 6a. Verify in Elasticsearch (raw index)

Query ES to confirm the document was re-indexed correctly:

```bash
curl -s -H "Authorization: ApiKey $ES_API_KEY" -H "Content-Type: application/json" \
  "${ES_HOST}/search-nethys/_search" -d '{
    "query": {"term": {"url": "<page_url>"}},
    "_source": ["title", "<field_of_interest>"]
  }' | jq '.hits.hits[0]._source'
```

### 6b. Verify in App Search (what the UI sees)

Query the App Search API to confirm the search experience is correct:

```bash
curl -s -H "Authorization: Bearer $ENT_SEARCH_PRIVATE_KEY" \
  -H "Content-Type: application/json" \
  "${ENT_SEARCH_ENDPOINT}/api/as/v1/engines/nethys/search" -d '{
    "query": "<search_term>",
    "filters": {"category": ["<Category>"]},
    "result_fields": {
      "title": {"raw": {}},
      "<field>": {"raw": {}}
    },
    "page": {"size": 5}
  }' | jq '.results[] | {title: .title.raw, <field>: .<field>.raw}'
```

Don't hesitate to also use the Chrome tools to browse to the deployed site and take screenshots to validate the fix looks like it should.

### 6c. Verify no regressions

Also crawl and check a page of a **different** category to confirm the fix didn't break anything for documents that should not be affected.

## 7. Clean up remaining affected documents

If the fix was verified on a sample, crawl all remaining affected pages in a single batch. The crawler accepts large seed URL lists (1000+). **Read `gotchas/batch-crawl-timing.md` before starting a large batch.**

To collect URLs for an entire category, paginate through the App Search search API:

```bash
source script/common.sh
python3 -c "
import json, urllib.request
urls = []
for page in range(1, 999):
    body = json.dumps({
        'query': '', 'filters': {'category': '<Category>'},
        'result_fields': {'url': {'raw': {}}},
        'page': {'size': 100, 'current': page}
    }).encode()
    req = urllib.request.Request(
        '${ENT_SEARCH_ENDPOINT}/api/as/v1/engines/nethys/search',
        data=body, method='POST',
        headers={'Authorization': 'Bearer ${ENT_SEARCH_PRIVATE_KEY}', 'Content-Type': 'application/json'}
    )
    resp = json.load(urllib.request.urlopen(req))
    for doc in resp['results']:
        urls.append(doc['url']['raw'])
    if page >= resp['meta']['page']['total_pages']:
        break
print(json.dumps(urls))
" > /tmp/urls.json
```

Then pass the URL list as seed_urls in the crawl request.

After crawling, run the same ES query from step 6a to confirm zero documents remain in the broken state.

## 8. Commit, push, deploy, and close

All changes must go through a PR — never commit directly to `main`.

1. Check out a new branch named after the issue (e.g., `fix/issue-N-short-description`).
2. Commit the fixture/code change with a message referencing the issue (`Fixes #N`).
3. Push the branch and open a PR that links to the issue.
4. After the PR is merged: if `src/` changed, deploy the frontend: `npm run deploy` (builds and pushes to the `gh-pages` branch). Backend-only fixes (pipeline, crawl rules, extraction rules, engine settings) don't need this.
5. The issue will be auto-closed when the PR merges (via `Fixes #N`). If not, close it manually.


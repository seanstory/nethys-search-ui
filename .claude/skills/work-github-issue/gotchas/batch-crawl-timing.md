# Gotcha: Batch crawl timing and limits

## Realistic timing

- **Targeted crawl (1-10 pages):** Under 10 seconds.
- **Medium batch (~100-500 pages):** 1-5 minutes.
- **Large batch (~2500 pages):** 20-40 minutes. The AoN site throttles large crawls; sustained rate drops to ~1-2 pages/sec.

Plan accordingly — don't block on polling a large batch crawl. Use background commands or check back periodically.

## API constraints

- **`max_crawl_depth` minimum is 1.** The API rejects `0` with `"Max crawl depth must be an integer"`. Use `1` for leaf-page-only crawls.
- **One crawl at a time.** Starting a new crawl while one is running returns a null response (no ID, no error). Wait for the current crawl to finish or cancel it first.
- **App Search field mappings use `.enum` subfields.** All text fields have a `.enum` keyword subfield (e.g., `category.enum`). Use `category.enum` for `term` queries and `terms` aggregations. The bare `category` field is analyzed text — `term` queries on it silently return zero hits and aggregations fail with a fielddata error.

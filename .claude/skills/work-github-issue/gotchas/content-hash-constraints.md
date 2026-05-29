# Gotcha: Content Hash Constraint Orphans Block Re-indexing

## Symptom

Pages are being fetched by the crawler (url-fetch + url-extracted events in logs) but don't appear in `search-nethys`. The `url-output` event shows:

```
event.outcome: failure
message: "Unexpected error while ingesting a document into Elasticsearch:
  '<config_oid>|<hash>' not unique value for field configuration_oid, content_hash"
```

## Root Cause

The crawler uses `.ent-search-actastic-crawler2_content_metadata-configuration_oid-content_hash-unique-constraint` to enforce that no two documents have the same content hash. When a document is deleted from `content_metadata` (e.g., after a full re-index), its constraint entry is **not cleaned up**.

The next time the crawler tries to index a page whose content hash matches an orphaned entry, it gets a uniqueness violation and fails to index it.

When a large batch of documents is replaced (full crawl re-index), thousands of constraint entries become orphaned simultaneously, causing widespread indexing failures.

## Detection

Run `script/check-dead-links.sh`. Look for:
- `Constraint orphan estimate` significantly > 0 (warning threshold: 5,000+)
- Large discrepancy between constraint count and content_metadata count

Or check crawler logs for `url-output failure` events with `not unique value` in the message.

## Fix

```bash
script/fix-content-hash-constraints.sh          # dry run: shows how many to delete
script/fix-content-hash-constraints.sh --confirm  # actually deletes orphaned entries
```

After cleanup, trigger a full crawl:
```bash
script/trigger-crawl.sh
```

## History

May 2026: 41,779 orphaned constraints accumulated from the initial 2023 crawl, blocking ~10,000+ pages from being updated. Cleaned up manually via delete_by_query.

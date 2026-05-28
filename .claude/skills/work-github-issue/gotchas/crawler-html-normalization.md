# Gotcha: Crawler normalizes HTML

The crawler normalizes `full_html` before it reaches the ingest pipeline: attribute order is alphabetized and single quotes become double quotes. For example, raw HTML `<span class='action' title='Two Actions'>` becomes `<span aria-label="Two Actions" class="action" role="img" title="Two Actions">` in `full_html`.

**Do not copy regex patterns from `curl` output** — always check the actual `full_html` field in ES. To inspect it, temporarily remove `full_html` from the pipeline's cleanup `remove` processor, crawl a page, then query the doc.

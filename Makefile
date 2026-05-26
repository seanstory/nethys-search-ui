.PHONY: help deploy-config restore update-pipeline update-crawl-rules update-engine update-curations trigger-crawl trigger-process-crawl check-dead-links delete-dead-links

SHELL := /bin/bash

help: ## Show this help
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | \
		awk 'BEGIN {FS = ":.*?## "}; {printf "  \033[36m%-28s\033[0m %s\n", $$1, $$2}' | sort

# ── Full restore sequence ────────────────────────────────────────────────────

restore: deploy-config trigger-crawl ## Full restore: push all config then start a crawl.
	@echo ""
	@echo "Crawl is running. Once it completes (~30 min), run:"
	@echo "  make update-curations"

deploy-config: update-pipeline update-crawl-rules update-engine ## Push pipeline, crawl rules, and engine settings (safe to run anytime).

# ── Individual config scripts ────────────────────────────────────────────────

update-pipeline: ## Push fixtures/pipeline.json → ES ingest pipeline
	bash script/update-pipeline.sh

update-crawl-rules: ## Sync fixtures/domains.json crawl rules → live crawler domain
	bash script/update-crawl-rules.sh

update-engine: ## Push fixtures/engine.json search settings → App Search
	bash script/update-engine.sh

update-curations: ## Sync fixtures/curations.json pinned results → App Search (run after crawl completes)
	bash script/update-curations.sh

# ── Crawl management ─────────────────────────────────────────────────────────

trigger-crawl: ## Trigger a full crawl immediately
	bash script/trigger-crawl.sh

trigger-process-crawl: ## Re-apply crawl rules to indexed docs (purges newly-denied URLs)
	bash script/trigger-process-crawl.sh

# ── Diagnostics / cleanup ────────────────────────────────────────────────────

check: ## Report dead-link counts and crawler URL metadata size
	bash script/check-dead-links.sh

delete-dead-links: ## Bulk-delete session-token docs. Add CONFIRM=1 to execute (default: dry-run)
	@if [ "$(CONFIRM)" = "1" ]; then \
		bash script/delete-dead-links.sh --confirm; \
	else \
		bash script/delete-dead-links.sh; \
	fi

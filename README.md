# [Search UI for Archives of Nethys](https://seanstory.github.io/nethys-search-ui/)

This project was bootstrapped with [Create React App](https://github.com/facebook/create-react-app),
and then implemented with [Elastic Search UI](https://docs.elastic.co/search-ui/overview).

## Maintaining/Developing

This project has two main components:
1. The frontend/UI, defined by this repo
2. The backend ETL that populates the data for search

### Frontend Code

This repo, at present, only has two files of note.

1. [App.tsx](./src/App.tsx). This is the project entrypoint. It contains the configuration for which App Search deployment to read from, which facets to display, and which component to use to display search results. As far as maintaining the project goes, this is where new facets should be added.
2. [CustomResultView.tsx](./src/components/CustomResultView.tsx). This replaces Search UI's default component for search results. Any changes to how individual search results should be displayed goes here.

You can run `npm run start` to run the project locally to test your changes. Once they are ready, you can deploy them to github pages with `npm run deploy`.

### Backend Code

The data that powers the search experience is gathered by Elastic's Crawler, processed through an Elasticsearch Ingest Pipeline, and then exposed through an App Search Engine.
Details for the deployment and engine being used are in [App.tsx](./src/App.tsx). Reach out to Sean for credentials to access the deployment.

The crawler runs a full crawl once per day.

Backend component configurations (pipeline, crawl rules, engine settings, curations) are stored as fixtures in [`script/fixtures/`](./script/fixtures/) and applied via `make` targets. Copy `.env.example` to `.env` and fill in credentials before running anything.

```bash
make help   # list all available targets
```

### Full restore (new deployment)

If you need to stand up a fresh Elastic Cloud deployment and restore the search experience from scratch:

```bash
# 1. Push all backend config
make deploy-config

# 2. Kick off a full crawl (~30 min to complete)
make trigger-crawl

# 3. After the crawl finishes, restore pinned search results
make update-curations
```

That's it — the site will be live at https://seanstory.github.io/nethys-search-ui/ once the crawl completes and curations are applied.

### Individual targets

| Target | Purpose |
|---|---|
| `make deploy-config` | Push pipeline + crawl rules + engine settings (runs the three update scripts below) |
| `make update-pipeline` | Push `fixtures/pipeline.json` → ES ingest pipeline |
| `make update-crawl-rules` | Sync `fixtures/domains.json` crawl rules → live crawler domain |
| `make update-engine` | Push `fixtures/engine.json` search settings → App Search |
| `make update-curations` | Sync `fixtures/curations.json` pinned results → App Search (run after crawl) |
| `make trigger-crawl` | Trigger a full crawl immediately |
| `make trigger-process-crawl` | Re-apply crawl rules to indexed docs (purges newly-denied URLs) |
| `make check` | Report dead-link counts and crawler URL metadata size |
| `make delete-dead-links` | Dry-run bulk delete of session-token docs (`CONFIRM=1` to execute) |

## Available Scripts

In the project directory, you can run:

### `npm run start`

Runs the app in the development mode.\
Open [http://localhost:3000](http://localhost:3000) to view it in the browser.

The page will reload if you make edits.\
You will also see any lint errors in the console.

### `npm run deploy`

Deploys the UI using `gh-pages` to Github Pages.

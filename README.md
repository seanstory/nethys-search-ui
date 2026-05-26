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

Backend component configurations (pipeline, crawl rules, engine settings) are stored as fixtures in [`script/fixtures/`](./script/fixtures/) and applied via automation scripts in [`script/`](./script/). Copy `.env.example` to `.env` and fill in credentials before running any script.

| Script | Purpose |
|---|---|
| `script/update-pipeline.sh` | Push ingest pipeline changes to Elasticsearch |
| `script/update-crawl-rules.sh` | Sync crawl rules from fixture to the live crawler domain |
| `script/update-engine.sh` | Push engine search settings to App Search |
| `script/update-curations.sh` | Sync pinned/hidden search results from fixture to App Search (resolves URLs to current doc IDs) |
| `script/trigger-crawl.sh` | Trigger a full crawl immediately |
| `script/trigger-process-crawl.sh` | Re-apply crawl rules to all indexed docs (purges newly-denied URLs without a full recrawl) |
| `script/check-dead-links.sh` | Report counts of session-token URLs, soft-404 docs, and crawler URL metadata size |
| `script/delete-dead-links.sh` | One-time bulk delete of session-token docs (dry-run by default; requires `--confirm`) |

## Available Scripts

In the project directory, you can run:

### `npm run start`

Runs the app in the development mode.\
Open [http://localhost:3000](http://localhost:3000) to view it in the browser.

The page will reload if you make edits.\
You will also see any lint errors in the console.

### `npm run deploy`

Deploys the UI using `gh-pages` to Github Pages.

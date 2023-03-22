import AppSearchAPIConnector from "@elastic/search-ui-app-search-connector";
import React from "react";
import {
  ErrorBoundary,
  Facet,
  SearchProvider,
  SearchBox,
  Results,
  PagingInfo,
  ResultsPerPage,
  Paging,
  WithSearch
} from "@elastic/react-search-ui";
import {
  BooleanFacet,
  Layout,
  SingleLinksFacet,
  SingleSelectFacet
} from "@elastic/react-search-ui-views";
import "@elastic/react-search-ui-views/lib/styles/styles.css";
import { SearchDriverOptions } from "@elastic/search-ui";
import {CustomResultView} from "./components/CustomResultView";

const connector = new AppSearchAPIConnector({
  searchKey: "search-he399pdnh3tms9u3nhwecppr",
  engineName: "nethys",
  endpointBase: "https://bc3-crawler-qa.ent.us-west2.gcp.elastic-cloud.com"
});

const config: SearchDriverOptions = {
  alwaysSearchOnInitialLoad: true,
  apiConnector: connector,
  hasA11yNotifications: true,
  searchQuery: {
    result_fields: {
      title: {
        snippet: {
          fallback: true
        }
      },
      meta_description: {
        raw: {},
        snippet: {
          fallback: true
        }
      },
      body_content: {
        raw: {}
      },
      thumbnail_url: {
        raw: {}
      },
      url: {
        raw: {}
      },
      meta_keywords: {
        raw: {}
      },
      category: {
        raw: {}
      },
      sub_category: {
        raw: {}
      }
    },
    search_fields: {
      title: {
        weight: 5
      },
      meta_description: {},
      body_content: {},
      meta_keywords: {},
    },
    facets: {
      category: { type: "value", size: 30 },
      sub_category: { type: "value", size: 30 },
      meta_keywords: { type: "value", size: 30 },
    },
    disjunctiveFacets: ["meta_keywords"],
    conditionalFacets: {
      'sub_category': ({ filters }) => {
        return filters.some(filter => filter.field === 'category')
      }
    }
  }
};

export default function App() {
  return (
      <SearchProvider config={config}>
        <WithSearch
            mapContextToProps={({ wasSearched }) => ({
              wasSearched
            })}
        >
          {({ wasSearched }) => {
            return (
                <div className="App">
                  <ErrorBoundary>
                    <Layout
                        header={<SearchBox debounceLength={0} searchAsYouType={true} />}
                        sideContent={
                          <div>
                            <Facet
                                field="category"
                                label="Category"
                                isFilterable={true}
                            />
                            <Facet
                                field="sub_category"
                                label="Sub-Category"
                                isFilterable={true}
                            />
                            <Facet
                                field="meta_keywords"
                                label="Keywords"
                                filterType="any"
                                isFilterable={true}
                            />
                          </div>
                        }
                        bodyContent={
                          <Results
                              resultView={CustomResultView}
                              titleField="title"
                              urlField="url"
                              thumbnailField="thumbnail_url"
                              shouldTrackClickThrough
                          />
                        }
                        bodyHeader={
                          <React.Fragment>
                            {wasSearched && <PagingInfo />}
                            {wasSearched && <ResultsPerPage />}
                          </React.Fragment>
                        }
                        bodyFooter={<Paging />}
                    />
                  </ErrorBoundary>
                </div>
            );
          }}
        </WithSearch>
      </SearchProvider>
  );
}
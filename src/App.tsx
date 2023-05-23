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
  endpointBase: "https://eff02e5b84a6427295fafb8589d99cf7.ent-search.us-west2.gcp.elastic-cloud.com"
});

const config: SearchDriverOptions = {
  alwaysSearchOnInitialLoad: true,
  apiConnector: connector,
  hasA11yNotifications: true,
  searchQuery: {
    facets: {
      category: { type: "value", size: 30 },
      sub_category: { type: "value", size: 30 },
      traits: { type: "value", size: 30 },
      meta_keywords: { type: "value", size: 30 },
      traditions: { type: "value", size: 30 },
      bloodlines: { type: "value", size: 30 },
      casting_components: { type: "value", size: 30 },
      range: { type: "value", size: 30 },
      save: { type: "value", size: 30 },
      deities: { type: "value", size: 250 },
      duration : { type: "value", size: 30 },
      spell_level: { type: "value", size: 30 },
      spell_type: { type: "value", size: 30 },
    },
    disjunctiveFacets: ["meta_keywords", "traditions"],
    conditionalFacets: {
      'sub_category': ({ filters }) => {
        return filters.some(filter => filter.field === 'category')
      },
      'traditions': ({ filters }) => {
        return filters.some(filter => filter.field === 'category' && filter.values.includes('Spells'))
      },
      'bloodlines': ({ filters }) => {
        return filters.some(filter => filter.field === 'category' && filter.values.includes('Spells'))
      },
      'casting_components': ({ filters }) => {
        return filters.some(filter => filter.field === 'category' && filter.values.includes('Spells'))
      },
      'range': ({ filters }) => {
        return filters.some(filter => filter.field === 'category' && filter.values.includes('Spells'))
      },
      'save': ({ filters }) => {
        return filters.some(filter => filter.field === 'category' && filter.values.includes('Spells'))
      },
      'deities': ({ filters }) => {
        return filters.some(filter => filter.field === 'category' && filter.values.includes('Spells'))
      },
      'duration': ({ filters }) => {
        return filters.some(filter => filter.field === 'category' && filter.values.includes('Spells'))
      },
      'spell_level': ({ filters }) => {
        return filters.some(filter => filter.field === 'category' && filter.values.includes('Spells'))
      },
      'spell_type': ({ filters }) => {
        return filters.some(filter => filter.field === 'category' && filter.values.includes('Spells'))
      },
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
                                field="spell_type"
                                label="Spell Type"
                                isFilterable={true}
                            />
                            <Facet
                                field="traditions"
                                label="Traditions"
                                isFilterable={true}
                            />
                            <Facet
                                field="spell_level"
                                label="Spell Level"
                                isFilterable={true}
                            />
                            <Facet
                                field="bloodlines"
                                label="Bloodlines"
                                isFilterable={true}
                            />
                            <Facet
                                field="deities"
                                label="Deity"
                                isFilterable={true}
                            />
                            <Facet
                                field="casting_components"
                                label="Casting Components"
                                isFilterable={true}
                            />
                            <Facet
                                field="save"
                                label="Saving Throw"
                                isFilterable={true}
                            />
                            <Facet
                                field="duration"
                                label="Duration"
                                isFilterable={true}
                            />
                            <Facet
                                field="traits"
                                label="Traits"
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
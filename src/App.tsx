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
  MultiCheckboxFacet,
  SingleLinksFacet,
  SingleSelectFacet
} from "@elastic/react-search-ui-views";
import { FacetViewProps } from "@elastic/react-search-ui-views";
import "@elastic/react-search-ui-views/lib/styles/styles.css";
import { SearchDriverOptions } from "@elastic/search-ui";
import {CustomResultView} from "./components/CustomResultView";

function sortedFacetView(comparator: (a: string, b: string) => number) {
  return function SortedFacet(props: FacetViewProps) {
    const sorted = [...props.options].sort((a, b) =>
      comparator(String(a.value), String(b.value))
    );
    return <MultiCheckboxFacet {...props} options={sorted} />;
  };
}

const DURATION_ORDER: string[] = [
  "until the end of your turn",
  "until the start of your next turn",
  "until the end of your next turn",
  "until the end of the target's next turn",
  "1 round",
  "1 round or sustained up to 1 minute",
  "3 rounds",
  "up to 1 minute",
  "sustained",
  "sustained for up to 1 minute",
  "sustained up to 1 minute",
  "1 minute",
  "1 minute (see text)",
  "1 minute or until discharged",
  "5 minutes",
  "10 minutes",
  "sustained up to 10 minutes",
  "10 minutes or 8 hours",
  "12 hours",
  "1 hour",
  "8 hours",
  "24 hours",
  "1 day",
  "until you leave the stance",
  "until your next daily preparations",
  "until the next time you make your daily preparations",
  "until the next time you make your daily preparations.",
  "unlimited",
  "varies",
  "see below",
];

function durationOrder(value: string): number {
  const idx = DURATION_ORDER.indexOf(value);
  return idx === -1 ? DURATION_ORDER.length : idx;
}

const NUM_ACTIONS_ORDER = ["free-action", "reaction", "one-action", "two-actions", "three-actions"];
function numActionsOrder(v: string) { const i = NUM_ACTIONS_ORDER.indexOf(v); return i === -1 ? NUM_ACTIONS_ORDER.length : i; }

const BULK_ORDER = ["—", "L", "1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "16", "40"];
function bulkOrder(v: string) { const i = BULK_ORDER.indexOf(v); return i === -1 ? BULK_ORDER.length : i; }

const numericSort = (a: string, b: string) => Number(a) - Number(b);

const AlphaFacet = sortedFacetView((a, b) => a.localeCompare(b));
const SpellLevelFacet = sortedFacetView(numericSort);
const ItemLevelFacet = sortedFacetView(numericSort);
const HardnessFacet = sortedFacetView(numericSort);
const DurabilityFacet = sortedFacetView(numericSort);
const BreakThresholdFacet = sortedFacetView(numericSort);
const NumActionsFacet = sortedFacetView((a, b) => numActionsOrder(a) - numActionsOrder(b));
const BulkFacet = sortedFacetView((a, b) => bulkOrder(a) - bulkOrder(b));
const DurationFacet = sortedFacetView((a, b) => durationOrder(a) - durationOrder(b));

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
      area: { type: "value", size: 30 },
      target: { type: "value", size: 30 },
      save: { type: "value", size: 30 },
      deities: { type: "value", size: 250 },
      duration : { type: "value", size: 30 },
      spell_level: { type: "value", size: 250 },
      spell_type: { type: "value", size: 30 },
      num_actions: { type: "value", size: 10 },
      requirements_flag: { type: "value", size: 2 },
      usage: { type: "value", size: 30 },
      bulk: { type: "value", size: 30 },
      item_level: { type: "value", size: 250 },
      hardness: { type: "value", size: 250 },
      durability: { type: "value", size: 250 },
      break_threshold: { type: "value", size: 250 },
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
      'area': ({ filters }) => {
        return filters.some(filter => filter.field === 'category' && filter.values.includes('Spells'))
      },
      'target': ({ filters }) => {
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
      'num_actions': ({ filters }) => {
        return filters.some(filter => filter.field === 'category' && (filter.values.includes('Actions') || filter.values.includes('Spells')))
      },
      'requirements_flag': ({ filters }) => {
        return filters.some(filter => filter.field === 'category' && filter.values.includes('Actions'))
      },
      'usage': ({ filters }) => {
        return filters.some(filter => filter.field === 'category' && (filter.values.includes('Equipment') || filter.values.includes('Shields')))
      },
      'bulk': ({ filters }) => {
        return filters.some(filter => filter.field === 'category' && (filter.values.includes('Equipment') || filter.values.includes('Shields')))
      },
      'item_level': ({ filters }) => {
        return filters.some(filter => filter.field === 'category' && (filter.values.includes('Equipment') || filter.values.includes('Shields')))
      },
      'hardness': ({ filters }) => {
        return filters.some(filter => filter.field === 'category' && (filter.values.includes('Equipment') || filter.values.includes('Shields')))
      },
      'durability': ({ filters }) => {
        return filters.some(filter => filter.field === 'category' && (filter.values.includes('Equipment') || filter.values.includes('Shields')))
      },
      'break_threshold': ({ filters }) => {
        return filters.some(filter => filter.field === 'category' && (filter.values.includes('Equipment') || filter.values.includes('Shields')))
      },
    }
  }
};

export default function App() {
  return (
      <SearchProvider config={config}>
        <WithSearch
            mapContextToProps={({ wasSearched, results }) => ({
              wasSearched,
              results
            })}
        >
          {({ wasSearched, results }) => {
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
                                view={AlphaFacet}
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
                                view={SpellLevelFacet}
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
                                field="range"
                                label="Range"
                                isFilterable={true}
                            />
                            <Facet
                                field="area"
                                label="Area"
                                isFilterable={true}
                            />
                            <Facet
                                field="target"
                                label="Target"
                                isFilterable={true}
                            />
                            <Facet
                                field="duration"
                                label="Duration"
                                isFilterable={true}
                                view={DurationFacet}
                            />
                            <Facet
                                field="num_actions"
                                label="Number of Actions"
                                isFilterable={false}
                                view={NumActionsFacet}
                            />
                            <Facet
                                field="requirements_flag"
                                label="Has Requirements"
                                isFilterable={false}
                            />
                            <Facet
                                field="usage"
                                label="Usage"
                                isFilterable={true}
                            />
                            <Facet
                                field="bulk"
                                label="Bulk"
                                isFilterable={false}
                                view={BulkFacet}
                            />
                            <Facet
                                field="item_level"
                                label="Item Level"
                                isFilterable={false}
                                view={ItemLevelFacet}
                            />
                            <Facet
                                field="hardness"
                                label="Hardness"
                                isFilterable={false}
                                view={HardnessFacet}
                            />
                            <Facet
                                field="durability"
                                label="Durability (HP)"
                                isFilterable={false}
                                view={DurabilityFacet}
                            />
                            <Facet
                                field="break_threshold"
                                label="Break Threshold"
                                isFilterable={false}
                                view={BreakThresholdFacet}
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
                          wasSearched && results.length === 0
                            ? (
                              <div style={{ padding: "2rem", textAlign: "center", color: "#666" }}>
                                <p style={{ fontSize: "1.2rem", marginBottom: "0.5rem" }}>No results found.</p>
                                <p style={{ fontSize: "0.95rem" }}>Try adjusting your search terms or filters.</p>
                              </div>
                            )
                            : (
                              <Results
                                  resultView={CustomResultView}
                                  titleField="title"
                                  urlField="url"
                                  thumbnailField="thumbnail_url"
                                  shouldTrackClickThrough
                              />
                            )
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
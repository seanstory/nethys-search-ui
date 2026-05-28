import AppSearchAPIConnector from "@elastic/search-ui-app-search-connector";
import React, { useEffect, useRef } from "react";
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
import { SearchDriverOptions, Filter } from "@elastic/search-ui";
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

const CREATURE_SIZE_ORDER = ["Tiny", "Small", "Medium", "Large", "Huge", "Gargantuan"];
function creatureSizeOrder(v: string) { const i = CREATURE_SIZE_ORDER.indexOf(v); return i === -1 ? CREATURE_SIZE_ORDER.length : i; }

const AlphaFacet = sortedFacetView((a, b) => a.localeCompare(b));
const SpellLevelFacet = sortedFacetView(numericSort);
const FeatLevelFacet = sortedFacetView(numericSort);
const ItemLevelFacet = sortedFacetView(numericSort);
const CreatureLevelFacet = sortedFacetView(numericSort);
const CreatureSizeFacet = sortedFacetView((a, b) => creatureSizeOrder(a) - creatureSizeOrder(b));
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

// Fields that are only relevant for specific categories. When the user
// switches to a different category, any active filters on these fields will
// be automatically cleared to prevent stale/broken search state.
//
// sub_category values are category-specific (e.g. "Cantrip" only exists
// under Spells) so it's also included here even though its conditional
// predicate only requires *any* category to be active.
const CONDITIONAL_FACET_FIELDS = [
  'sub_category',
  'traditions',
  'bloodlines',
  'casting_components',
  'range',
  'area',
  'target',
  'save',
  'deities',
  'duration',
  'spell_level',
  'spell_type',
  'num_actions',
  'requirements_flag',
  'feat_level',
  'prerequisites_flag',
  'usage',
  'bulk',
  'item_level',
  'hardness',
  'durability',
  'break_threshold',
  'creature_level',
  'creature_size',
] as const;

// Helper: check if a filter's values include a given string category.
// Filter.values is FilterValue[] (string | number | boolean | range), but
// category values are always strings in practice.
function filterHasCategory(filter: Filter, category: string): boolean {
  return filter.values.some(v => v === category);
}

const conditionalFacets = {
  'sub_category': ({ filters }: { filters: Filter[] }) => {
    return filters.some(filter => filter.field === 'category')
  },
  'traditions': ({ filters }: { filters: Filter[] }) => {
    return filters.some(filter => filter.field === 'category' && filterHasCategory(filter, 'Spells'))
  },
  'bloodlines': ({ filters }: { filters: Filter[] }) => {
    return filters.some(filter => filter.field === 'category' && filterHasCategory(filter, 'Spells'))
  },
  'casting_components': ({ filters }: { filters: Filter[] }) => {
    return filters.some(filter => filter.field === 'category' && filterHasCategory(filter, 'Spells'))
  },
  'range': ({ filters }: { filters: Filter[] }) => {
    return filters.some(filter => filter.field === 'category' && filterHasCategory(filter, 'Spells'))
  },
  'area': ({ filters }: { filters: Filter[] }) => {
    return filters.some(filter => filter.field === 'category' && filterHasCategory(filter, 'Spells'))
  },
  'target': ({ filters }: { filters: Filter[] }) => {
    return filters.some(filter => filter.field === 'category' && filterHasCategory(filter, 'Spells'))
  },
  'save': ({ filters }: { filters: Filter[] }) => {
    return filters.some(filter => filter.field === 'category' && filterHasCategory(filter, 'Spells'))
  },
  'deities': ({ filters }: { filters: Filter[] }) => {
    return filters.some(filter => filter.field === 'category' && filterHasCategory(filter, 'Spells'))
  },
  'duration': ({ filters }: { filters: Filter[] }) => {
    return filters.some(filter => filter.field === 'category' && filterHasCategory(filter, 'Spells'))
  },
  'spell_level': ({ filters }: { filters: Filter[] }) => {
    return filters.some(filter => filter.field === 'category' && filterHasCategory(filter, 'Spells'))
  },
  'spell_type': ({ filters }: { filters: Filter[] }) => {
    return filters.some(filter => filter.field === 'category' && filterHasCategory(filter, 'Spells'))
  },
  'num_actions': ({ filters }: { filters: Filter[] }) => {
    return filters.some(filter => filter.field === 'category' && (filterHasCategory(filter, 'Actions') || filterHasCategory(filter, 'Spells')))
  },
  'requirements_flag': ({ filters }: { filters: Filter[] }) => {
    return filters.some(filter => filter.field === 'category' && filterHasCategory(filter, 'Actions'))
  },
  'feat_level': ({ filters }: { filters: Filter[] }) => {
    return filters.some(filter => filter.field === 'category' && filterHasCategory(filter, 'Feats'))
  },
  'prerequisites_flag': ({ filters }: { filters: Filter[] }) => {
    return filters.some(filter => filter.field === 'category' && filterHasCategory(filter, 'Feats'))
  },
  'usage': ({ filters }: { filters: Filter[] }) => {
    return filters.some(filter => filter.field === 'category' && (filterHasCategory(filter, 'Equipment') || filterHasCategory(filter, 'Shields')))
  },
  'bulk': ({ filters }: { filters: Filter[] }) => {
    return filters.some(filter => filter.field === 'category' && (filterHasCategory(filter, 'Equipment') || filterHasCategory(filter, 'Shields')))
  },
  'item_level': ({ filters }: { filters: Filter[] }) => {
    return filters.some(filter => filter.field === 'category' && (filterHasCategory(filter, 'Equipment') || filterHasCategory(filter, 'Shields')))
  },
  'hardness': ({ filters }: { filters: Filter[] }) => {
    return filters.some(filter => filter.field === 'category' && (filterHasCategory(filter, 'Equipment') || filterHasCategory(filter, 'Shields')))
  },
  'durability': ({ filters }: { filters: Filter[] }) => {
    return filters.some(filter => filter.field === 'category' && (filterHasCategory(filter, 'Equipment') || filterHasCategory(filter, 'Shields')))
  },
  'break_threshold': ({ filters }: { filters: Filter[] }) => {
    return filters.some(filter => filter.field === 'category' && (filterHasCategory(filter, 'Equipment') || filterHasCategory(filter, 'Shields')))
  },
  'creature_level': ({ filters }: { filters: Filter[] }) => {
    return filters.some(filter => filter.field === 'category' && (filterHasCategory(filter, 'Monsters') || filterHasCategory(filter, 'NPCs')))
  },
  'creature_size': ({ filters }: { filters: Filter[] }) => {
    return filters.some(filter => filter.field === 'category' && (filterHasCategory(filter, 'Monsters') || filterHasCategory(filter, 'NPCs')))
  },
};

const config: SearchDriverOptions = {
  alwaysSearchOnInitialLoad: true,
  apiConnector: connector,
  hasA11yNotifications: true,
  searchQuery: {
    facets: {
      category: { type: "value", size: 30 },
      sub_category: { type: "value", size: 30 },
      rarity: { type: "value", size: 10 },
      traits: { type: "value", size: 30 },
      source_book: { type: "value", size: 50 },
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
      feat_level: { type: "value", size: 250 },
      prerequisites_flag: { type: "value", size: 2 },
      usage: { type: "value", size: 30 },
      bulk: { type: "value", size: 30 },
      item_level: { type: "value", size: 250 },
      hardness: { type: "value", size: 250 },
      durability: { type: "value", size: 250 },
      break_threshold: { type: "value", size: 250 },
      creature_level: { type: "value", size: 250 },
      creature_size: { type: "value", size: 10 },
    },
    disjunctiveFacets: ["meta_keywords", "traditions"],
    conditionalFacets,
  }
};

// Clears stale category-specific filters whenever the active category changes.
// Without this, switching from e.g. Spells to Equipment leaves Spell Level /
// Traditions / etc. filters active, producing empty or misleading results.
function CategoryFilterGuard({
  filters,
  removeFilter,
}: {
  filters: Filter[];
  removeFilter: (field: string) => void;
}) {
  // Track the set of active category values across renders.
  const prevCategoryValuesRef = useRef<string | null>(null);

  useEffect(() => {
    const categoryFilter = filters.find(f => f.field === 'category');
    const categoryValues = categoryFilter
      ? [...categoryFilter.values].map(String).sort().join(',')
      : '';

    // Only act when the category selection actually changed.
    if (prevCategoryValuesRef.current === null) {
      prevCategoryValuesRef.current = categoryValues;
      return;
    }
    if (prevCategoryValuesRef.current === categoryValues) return;

    prevCategoryValuesRef.current = categoryValues;

    // Remove any conditional-facet filters that are no longer applicable.
    for (const field of CONDITIONAL_FACET_FIELDS) {
      const hasActiveFilter = filters.some(f => f.field === field);
      if (!hasActiveFilter) continue;

      const predicate = conditionalFacets[field as keyof typeof conditionalFacets];
      const stillVisible = predicate({ filters });
      if (!stillVisible) {
        removeFilter(field);
      }
    }
  }, [filters, removeFilter]);

  return null;
}

export default function App() {
  return (
      <SearchProvider config={config}>
        <WithSearch
            mapContextToProps={({ wasSearched, results, filters, removeFilter, clearFilters }) => ({
              wasSearched,
              results,
              filters,
              removeFilter,
              clearFilters,
            })}
        >
          {({ wasSearched, results, filters, removeFilter, clearFilters }) => {
            return (
                <div className="App">
                  <CategoryFilterGuard filters={filters} removeFilter={removeFilter} />
                  <ErrorBoundary>
                    <Layout
                        header={<SearchBox debounceLength={0} searchAsYouType={true} />}
                        sideContent={
                          <div>
                            {filters.length > 0 && (
                              <button
                                onClick={() => clearFilters()}
                                style={{
                                  display: "block",
                                  width: "100%",
                                  marginBottom: "1rem",
                                  padding: "0.5rem 1rem",
                                  background: "#c0392b",
                                  color: "#fff",
                                  border: "none",
                                  borderRadius: "4px",
                                  cursor: "pointer",
                                  fontSize: "0.9rem",
                                  fontWeight: "bold",
                                }}
                              >
                                Clear all filters
                              </button>
                            )}
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
                                field="rarity"
                                label="Rarity"
                                isFilterable={false}
                            />
                            <Facet
                                field="source_book"
                                label="Source Book"
                                isFilterable={true}
                                view={AlphaFacet}
                                show={10}
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
                                show={10}
                            />
                            <Facet
                                field="bloodlines"
                                label="Bloodlines"
                                isFilterable={true}
                                show={10}
                            />
                            <Facet
                                field="deities"
                                label="Deity"
                                isFilterable={true}
                                show={10}
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
                                show={10}
                            />
                            <Facet
                                field="area"
                                label="Area"
                                isFilterable={true}
                                show={10}
                            />
                            <Facet
                                field="target"
                                label="Target"
                                isFilterable={true}
                                show={10}
                            />
                            <Facet
                                field="duration"
                                label="Duration"
                                isFilterable={true}
                                view={DurationFacet}
                                show={10}
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
                                field="feat_level"
                                label="Feat Level"
                                isFilterable={false}
                                view={FeatLevelFacet}
                                show={10}
                            />
                            <Facet
                                field="prerequisites_flag"
                                label="Has Prerequisites"
                                isFilterable={false}
                            />
                            <Facet
                                field="usage"
                                label="Usage"
                                isFilterable={true}
                                show={10}
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
                                show={10}
                            />
                            <Facet
                                field="hardness"
                                label="Hardness"
                                isFilterable={false}
                                view={HardnessFacet}
                                show={10}
                            />
                            <Facet
                                field="durability"
                                label="Durability (HP)"
                                isFilterable={false}
                                view={DurabilityFacet}
                                show={10}
                            />
                            <Facet
                                field="break_threshold"
                                label="Break Threshold"
                                isFilterable={false}
                                view={BreakThresholdFacet}
                                show={10}
                            />
                            <Facet
                                field="creature_level"
                                label="Creature Level"
                                isFilterable={false}
                                view={CreatureLevelFacet}
                                show={10}
                            />
                            <Facet
                                field="creature_size"
                                label="Size"
                                isFilterable={false}
                                view={CreatureSizeFacet}
                            />
                            <Facet
                                field="traits"
                                label="Traits"
                                isFilterable={true}
                                show={10}
                            />
                            <Facet
                                field="meta_keywords"
                                label="Keywords"
                                filterType="any"
                                isFilterable={true}
                                show={10}
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
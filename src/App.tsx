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

// Default number of options shown before the facet is collapsed.
const DEFAULT_FACET_SHOW = 10;

// Returns a facet view that sorts options and supports show-more / show-less
// collapse behaviour managed locally in the view (not by the Facet container).
//
// initialShow: how many options to show when collapsed (default 10).
// comparator:  sort comparator; pass null for no sorting (alpha by default via
//              whatever order the API returns).
function sortedFacetView(
  comparator: ((a: string, b: string) => number) | null,
  initialShow: number = DEFAULT_FACET_SHOW
) {
  return function SortedFacet(props: FacetViewProps) {
    const [expanded, setExpanded] = React.useState(false);

    const sorted = comparator
      ? [...props.options].sort((a, b) =>
          comparator(String(a.value), String(b.value))
        )
      : props.options;

    const visible = expanded ? sorted : sorted.slice(0, initialShow);
    const hasMore = sorted.length > initialShow;

    return (
      <>
        <MultiCheckboxFacet
          {...props}
          options={visible}
          // Suppress the built-in "+ More" button; we render our own below.
          showMore={false}
          onMoreClick={() => {}}
        />
        {hasMore && !expanded && (
          <button
            type="button"
            className="sui-facet-view-more"
            onClick={() => setExpanded(true)}
            aria-label="Show more options"
          >
            + More ({sorted.length - initialShow} more)
          </button>
        )}
        {hasMore && expanded && (
          <button
            type="button"
            className="sui-facet-view-more"
            onClick={() => setExpanded(false)}
            aria-label="Show fewer options"
          >
            - Show less
          </button>
        )}
      </>
    );
  };
}

// Unsorted collapsible facet view (uses API return order).
function collapsibleFacetView(initialShow: number = DEFAULT_FACET_SHOW) {
  return sortedFacetView(null, initialShow);
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

// Extracts the leading integer (possibly negative) from a bucket label such as
// "Level 5", "Levels 1–2", "Levels 9–12", "Level -1 to 0", "Level 21+".
// Bucket labels are always sorted by this first number so that they appear in
// natural level-ascending order regardless of the en-dash separator used.
function levelBucketOrder(v: string): number {
  const m = v.match(/-?\d+/);
  return m ? parseInt(m[0], 10) : 9999;
}

const AlphaFacet = sortedFacetView((a, b) => a.localeCompare(b));
const SpellLevelBucketFacet = sortedFacetView((a, b) => levelBucketOrder(a) - levelBucketOrder(b));
const FeatLevelBucketFacet = sortedFacetView((a, b) => levelBucketOrder(a) - levelBucketOrder(b));
const ItemLevelBucketFacet = sortedFacetView((a, b) => levelBucketOrder(a) - levelBucketOrder(b), 12);
const CreatureLevelBucketFacet = sortedFacetView((a, b) => levelBucketOrder(a) - levelBucketOrder(b));
const CreatureSizeFacet = sortedFacetView((a, b) => creatureSizeOrder(a) - creatureSizeOrder(b));
const HardnessFacet = sortedFacetView(numericSort);
const DurabilityFacet = sortedFacetView(numericSort);
const BreakThresholdFacet = sortedFacetView(numericSort);
const NumActionsFacet = sortedFacetView((a, b) => numActionsOrder(a) - numActionsOrder(b));
const BulkFacet = sortedFacetView((a, b) => bulkOrder(a) - bulkOrder(b));
const DurationFacet = sortedFacetView((a, b) => durationOrder(a) - durationOrder(b));
const CollapsibleFacet = collapsibleFacetView();

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
  'spell_level_bucket',
  'spell_type',
  'num_actions',
  'requirements_flag',
  'feat_level_bucket',
  'prerequisites_flag',
  'usage',
  'bulk',
  'item_level_bucket',
  'hardness',
  'durability',
  'break_threshold',
  'creature_level_bucket',
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
  'spell_level_bucket': ({ filters }: { filters: Filter[] }) => {
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
  'feat_level_bucket': ({ filters }: { filters: Filter[] }) => {
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
  'item_level_bucket': ({ filters }: { filters: Filter[] }) => {
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
  'creature_level_bucket': ({ filters }: { filters: Filter[] }) => {
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
      spell_level_bucket: { type: "value", size: 15 },
      spell_type: { type: "value", size: 30 },
      num_actions: { type: "value", size: 10 },
      requirements_flag: { type: "value", size: 2 },
      feat_level_bucket: { type: "value", size: 15 },
      prerequisites_flag: { type: "value", size: 2 },
      usage: { type: "value", size: 30 },
      bulk: { type: "value", size: 30 },
      item_level_bucket: { type: "value", size: 15 },
      hardness: { type: "value", size: 250 },
      durability: { type: "value", size: 250 },
      break_threshold: { type: "value", size: 250 },
      creature_level_bucket: { type: "value", size: 10 },
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
                        header={
                          <React.Fragment>
                            <SearchBox debounceLength={0} searchAsYouType={true} />
                            <div style={{ textAlign: "right", marginTop: "0.4rem" }}>
                              <a
                                href="https://github.com/seanstory/nethys-search-ui/issues"
                                target="_blank"
                                rel="noopener noreferrer"
                                title="Request a feature or report a bug on GitHub"
                                style={{ color: "white", opacity: 0.8, display: "inline-block", lineHeight: 0, transition: "opacity 0.15s" }}
                                onMouseEnter={e => (e.currentTarget.style.opacity = "1")}
                                onMouseLeave={e => (e.currentTarget.style.opacity = "0.8")}
                              >
                                <svg
                                  xmlns="http://www.w3.org/2000/svg"
                                  viewBox="0 0 24 24"
                                  width="24"
                                  height="24"
                                  fill="currentColor"
                                  aria-label="GitHub"
                                >
                                  <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
                                </svg>
                              </a>
                            </div>
                          </React.Fragment>
                        }
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
                                show={250}
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
                                show={250}
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
                                view={CollapsibleFacet}
                                show={250}
                            />
                            <Facet
                                field="spell_level_bucket"
                                label="Spell Level"
                                isFilterable={false}
                                view={SpellLevelBucketFacet}
                                show={250}
                            />
                            <Facet
                                field="bloodlines"
                                label="Bloodlines"
                                isFilterable={true}
                                view={CollapsibleFacet}
                                show={250}
                            />
                            <Facet
                                field="deities"
                                label="Deity"
                                isFilterable={true}
                                view={CollapsibleFacet}
                                show={250}
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
                                view={CollapsibleFacet}
                                show={250}
                            />
                            <Facet
                                field="area"
                                label="Area"
                                isFilterable={true}
                                view={CollapsibleFacet}
                                show={250}
                            />
                            <Facet
                                field="target"
                                label="Target"
                                isFilterable={true}
                                view={CollapsibleFacet}
                                show={250}
                            />
                            <Facet
                                field="duration"
                                label="Duration"
                                isFilterable={true}
                                view={DurationFacet}
                                show={250}
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
                                field="feat_level_bucket"
                                label="Feat Level"
                                isFilterable={false}
                                view={FeatLevelBucketFacet}
                                show={250}
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
                                view={CollapsibleFacet}
                                show={250}
                            />
                            <Facet
                                field="bulk"
                                label="Bulk"
                                isFilterable={false}
                                view={BulkFacet}
                            />
                            <Facet
                                field="item_level_bucket"
                                label="Item Level"
                                isFilterable={false}
                                view={ItemLevelBucketFacet}
                                show={250}
                            />
                            <Facet
                                field="hardness"
                                label="Hardness"
                                isFilterable={false}
                                view={HardnessFacet}
                                show={250}
                            />
                            <Facet
                                field="durability"
                                label="Durability (HP)"
                                isFilterable={false}
                                view={DurabilityFacet}
                                show={250}
                            />
                            <Facet
                                field="break_threshold"
                                label="Break Threshold"
                                isFilterable={false}
                                view={BreakThresholdFacet}
                                show={250}
                            />
                            <Facet
                                field="creature_level_bucket"
                                label="Creature Level"
                                isFilterable={false}
                                view={CreatureLevelBucketFacet}
                                show={250}
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
                                view={CollapsibleFacet}
                                show={250}
                            />
                            <Facet
                                field="meta_keywords"
                                label="Keywords"
                                filterType="any"
                                isFilterable={true}
                                view={CollapsibleFacet}
                                show={250}
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
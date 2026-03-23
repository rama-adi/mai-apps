import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import type { MaiDbSong } from "maidb-data";
import { REGION_LABELS, filterSongs, sortSongsByReleaseDate, type SongFilters } from "maidb-data";
import {
  ArrowLeft,
  ChevronDown,
  ChevronUp,
  Music,
  Search,
  SlidersHorizontal,
  X,
} from "lucide-react";
import { useDeferredValue, useEffect, useMemo, useState } from "react";
import { SongCard, SongCardSkeleton } from "../../components/SongCard";
import { getSongsPageLatest, getSongsPageFilterOptions } from "../-server/songs-index";
import { useSongs } from "../../lib/use-songs";

type FilterOption = { name: string };
type TypeOption = { type: string; name: string };

type SongBrowserSearchParams = {
  q?: string;
  category?: string;
  version?: string;
  difficulty?: string;
  type?: string;
  region?: string;
  minBpm?: number;
  maxBpm?: number;
  minLevel?: number;
  maxLevel?: number;
  isNew?: boolean;
};

type SongBrowserFilterOptions = {
  categories: string[];
  versions: string[];
  difficulties: FilterOption[];
  types: TypeOption[];
};

const selectClass =
  "h-9 w-full rounded-md border bg-background px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50";
const inputClass =
  "h-9 w-full rounded-md border bg-background px-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50";

const validateSongBrowserSearch = (search: Record<string, unknown>): SongBrowserSearchParams => ({
  q: typeof search.q === "string" ? search.q : undefined,
  category: typeof search.category === "string" ? search.category : undefined,
  version: typeof search.version === "string" ? search.version : undefined,
  difficulty: typeof search.difficulty === "string" ? search.difficulty : undefined,
  type: typeof search.type === "string" ? search.type : undefined,
  region: typeof search.region === "string" ? search.region : undefined,
  minBpm: typeof search.minBpm === "number" ? search.minBpm : undefined,
  maxBpm: typeof search.maxBpm === "number" ? search.maxBpm : undefined,
  minLevel: typeof search.minLevel === "number" ? search.minLevel : undefined,
  maxLevel: typeof search.maxLevel === "number" ? search.maxLevel : undefined,
  isNew: typeof search.isNew === "boolean" ? search.isNew : undefined,
});

export const Route = createFileRoute("/songs/")({
  validateSearch: validateSongBrowserSearch,
  head: () => ({
    meta: [
      { title: "Browse Songs - MaiDB" },
      {
        name: "description",
        content:
          "Explore every maimai song and chart. Browse difficulty levels, BPM, version history, and more.",
      },
    ],
  }),
  loader: async () => {
    const [songs, filterOptions] = await Promise.all([
      getSongsPageLatest(),
      getSongsPageFilterOptions(),
    ]);
    return { songs, filterOptions };
  },
  component: SongBrowserPage,
});

function SongBrowserPage() {
  const { songs: loaderSongs, filterOptions } = Route.useLoaderData() as {
    songs: MaiDbSong[];
    filterOptions: SongBrowserFilterOptions;
  };
  const search = Route.useSearch();
  const navigate = useNavigate({ from: "/songs/" });
  const { songs: allClientSongs } = useSongs();
  const [searchInput, setSearchInput] = useState(search.q ?? "");
  const deferredSearch = useDeferredValue(searchInput);
  const [filtersOpen, setFiltersOpen] = useState(false);

  const navigateWithSearch = (
    updater: (prev: SongBrowserSearchParams) => SongBrowserSearchParams,
  ) =>
    void navigate({
      to: "/songs",
      search: (prev) => updater(prev as SongBrowserSearchParams),
      replace: true,
    });

  const searchQuery = deferredSearch.trim();
  useEffect(() => {
    if (searchQuery !== (search.q ?? "")) {
      navigateWithSearch((prev) => ({ ...prev, q: searchQuery || undefined }));
    }
  }, [navigate, search.q, searchQuery]);

  const setFilter = <K extends keyof SongBrowserSearchParams>(
    key: K,
    value: SongBrowserSearchParams[K],
  ) => {
    navigateWithSearch((prev) => ({ ...prev, [key]: value }));
  };

  const category = search.category ?? "";
  const version = search.version ?? "";
  const difficulty = search.difficulty ?? "";
  const type = search.type ?? "";
  const region = search.region ?? "";
  const minBpm = search.minBpm;
  const maxBpm = search.maxBpm;
  const minLevel = search.minLevel;
  const maxLevel = search.maxLevel;
  const isNew = search.isNew;

  const activeFilterCount = [
    category,
    version,
    difficulty,
    type,
    region,
    minBpm != null ? "y" : "",
    maxBpm != null ? "y" : "",
    minLevel != null ? "y" : "",
    maxLevel != null ? "y" : "",
    isNew != null ? "y" : "",
  ].filter(Boolean).length;

  const hasSearch = searchQuery.length > 0;
  const hasFilters = activeFilterCount > 0;
  const isFiltered = hasSearch || hasFilters;

  const filters: SongFilters = {
    ...(searchQuery ? { q: searchQuery } : {}),
    ...(category ? { category } : {}),
    ...(version ? { version } : {}),
    ...(difficulty ? { difficulty } : {}),
    ...(type ? { type } : {}),
    ...(region ? { region } : {}),
    ...(minBpm != null ? { minBpm } : {}),
    ...(maxBpm != null ? { maxBpm } : {}),
    ...(minLevel != null ? { minLevel } : {}),
    ...(maxLevel != null ? { maxLevel } : {}),
    ...(isNew != null ? { isNew } : {}),
  };

  const allSongs = useMemo(() => {
    if (isFiltered) {
      if (!allClientSongs) return undefined;
      return filterSongs(allClientSongs, filters);
    }
    if (allClientSongs) {
      return sortSongsByReleaseDate(allClientSongs);
    }
    return loaderSongs;
  }, [allClientSongs, filters, isFiltered, loaderSongs]);

  const isLoading = isFiltered && allSongs === undefined;
  const PAGE_SIZE = 30;
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const songs = allSongs?.slice(0, visibleCount);
  const canLoadMore = allSongs != null && visibleCount < allSongs.length;

  const clearFilters = () => {
    navigateWithSearch((prev) => ({ q: prev.q }));
  };

  return (
    <main className="mx-auto max-w-5xl flex-1 px-4 pb-12 pt-6">
      {/* Back nav */}
      <Link
        to="/"
        className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        Home
      </Link>

      {/* Search bar — sticks below the navbar */}
      <section className="sticky top-[53px] z-10 -mx-4 border-b bg-background/80 px-4 pb-3 pt-2 backdrop-blur-lg">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            value={searchInput}
            onChange={(event) => setSearchInput(event.target.value)}
            placeholder="Search song title or alias..."
            className="h-11 w-full rounded-lg border bg-card pl-10 pr-4 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
          />
          {!allClientSongs && (
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground">
              Loading...
            </span>
          )}
        </div>

        <div className="mt-2 flex items-center gap-2">
          <button
            type="button"
            onClick={() => setFiltersOpen(!filtersOpen)}
            className="flex items-center gap-1.5 rounded-md border bg-card px-2.5 py-1 text-xs font-semibold text-muted-foreground transition-colors hover:text-foreground"
          >
            <SlidersHorizontal className="h-3 w-3" />
            Filters
            {activeFilterCount > 0 && (
              <span className="rounded-full bg-primary px-1.5 py-0.5 text-[9px] font-bold leading-none text-primary-foreground">
                {activeFilterCount}
              </span>
            )}
            {filtersOpen ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
          </button>

          {activeFilterCount > 0 && (
            <button
              type="button"
              onClick={clearFilters}
              className="flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-primary hover:underline"
            >
              <X className="h-3 w-3" />
              Clear
            </button>
          )}

          <span className="ml-auto text-[11px] tabular-nums text-muted-foreground">
            {isLoading
              ? "Loading..."
              : allSongs
                ? `${allSongs.length} song${allSongs.length !== 1 ? "s" : ""}`
                : ""}
          </span>
        </div>

        {filtersOpen && (
          <div className="mt-2 grid gap-x-4 gap-y-3 rounded-lg border bg-card p-4 sm:grid-cols-2 lg:grid-cols-3">
            <FilterField label="Category">
              <select
                value={category}
                onChange={(event) => setFilter("category", event.target.value || undefined)}
                className={selectClass}
              >
                <option value="">All</option>
                {filterOptions.categories.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </FilterField>

            <FilterField label="Version">
              <select
                value={version}
                onChange={(event) => setFilter("version", event.target.value || undefined)}
                className={selectClass}
              >
                <option value="">All</option>
                {filterOptions.versions.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </FilterField>

            <FilterField label="Difficulty">
              <select
                value={difficulty}
                onChange={(event) => setFilter("difficulty", event.target.value || undefined)}
                className={selectClass}
              >
                <option value="">All</option>
                <option value="basic">Basic</option>
                <option value="advanced">Advanced</option>
                <option value="expert">Expert</option>
                <option value="master">Master</option>
                <option value="remaster">Re:Master</option>
              </select>
            </FilterField>

            <FilterField label="Type">
              <select
                value={type}
                onChange={(event) => setFilter("type", event.target.value || undefined)}
                className={selectClass}
              >
                <option value="">All</option>
                {filterOptions.types.map((option) => (
                  <option key={option.type} value={option.type}>
                    {option.name}
                  </option>
                ))}
              </select>
            </FilterField>

            <FilterField label="Level Range">
              <div className="flex gap-2">
                <input
                  type="number"
                  value={minLevel ?? ""}
                  onChange={(event) =>
                    setFilter(
                      "minLevel",
                      event.target.value ? Number(event.target.value) : undefined,
                    )
                  }
                  placeholder="Min"
                  step="0.1"
                  className={inputClass}
                />
                <input
                  type="number"
                  value={maxLevel ?? ""}
                  onChange={(event) =>
                    setFilter(
                      "maxLevel",
                      event.target.value ? Number(event.target.value) : undefined,
                    )
                  }
                  placeholder="Max"
                  step="0.1"
                  className={inputClass}
                />
              </div>
            </FilterField>

            <FilterField label="BPM Range">
              <div className="flex gap-2">
                <input
                  type="number"
                  value={minBpm ?? ""}
                  onChange={(event) =>
                    setFilter("minBpm", event.target.value ? Number(event.target.value) : undefined)
                  }
                  placeholder="Min"
                  className={inputClass}
                />
                <input
                  type="number"
                  value={maxBpm ?? ""}
                  onChange={(event) =>
                    setFilter("maxBpm", event.target.value ? Number(event.target.value) : undefined)
                  }
                  placeholder="Max"
                  className={inputClass}
                />
              </div>
            </FilterField>

            <FilterField label="Region">
              <select
                value={region}
                onChange={(event) => setFilter("region", event.target.value || undefined)}
                className={selectClass}
              >
                <option value="">All</option>
                {(Object.entries(REGION_LABELS) as [string, string][]).map(([key, label]) => (
                  <option key={key} value={key}>
                    {label}
                  </option>
                ))}
              </select>
            </FilterField>

            <FilterField label="Status">
              <select
                value={isNew == null ? "" : isNew ? "true" : "false"}
                onChange={(event) => {
                  const value = event.target.value;
                  setFilter("isNew", value === "" ? undefined : value === "true");
                }}
                className={selectClass}
              >
                <option value="">All</option>
                <option value="true">New only</option>
                <option value="false">Not new</option>
              </select>
            </FilterField>
          </div>
        )}
      </section>

      {/* Song grid */}
      <section className="mt-4">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {isLoading
            ? Array.from({ length: 12 }).map((_, index) => <SongCardSkeleton key={index} />)
            : songs && songs.length > 0
              ? songs.map((song) => <SongCard key={song.songId} song={song} />)
              : null}
        </div>

        {canLoadMore && (
          <div className="mt-6 flex justify-center">
            <button
              type="button"
              onClick={() => setVisibleCount((count) => count + PAGE_SIZE)}
              className="rounded-lg border bg-card px-6 py-2.5 text-sm font-semibold text-foreground transition-colors hover:bg-accent"
            >
              Load more
            </button>
          </div>
        )}

        {!isLoading && allSongs && allSongs.length === 0 && (
          <div className="flex flex-col items-center justify-center rounded-lg border bg-card py-16 text-center">
            <Music className="mb-4 h-12 w-12 text-muted-foreground/40" />
            <p className="m-0 text-lg font-bold text-foreground">
              {isFiltered ? "No songs match" : "No songs found"}
            </p>
            <p className="m-0 mt-1 text-sm text-muted-foreground">
              {isFiltered ? "Try different search terms or filters." : "Database is empty."}
            </p>
          </div>
        )}
      </section>
    </main>
  );
}

function FilterField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
        {label}
      </label>
      {children}
    </div>
  );
}

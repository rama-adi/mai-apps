import { REGION_LABELS } from "maidb-data";
import { Music, Search, SlidersHorizontal, ChevronDown, ChevronUp } from "lucide-react";
import { useDeferredValue, useEffect, useMemo, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { SongCard, SongCardSkeleton } from "./SongCard";
import { useSongs } from "../lib/use-songs";
import { filterSongs, sortSongsByReleaseDate, type SongFilters } from "maidb-data";
import type { MaiDbSong } from "maidb-data";

type FilterOption = { name: string };
type TypeOption = { type: string; name: string };

export type SongBrowserSearchParams = {
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

export type SongBrowserFilterOptions = {
  categories: string[];
  versions: string[];
  difficulties: FilterOption[];
  types: TypeOption[];
};

type SongBrowserProps = {
  loaderSongs: MaiDbSong[];
  filterOptions: SongBrowserFilterOptions;
  search: SongBrowserSearchParams;
  navigationTarget: "/" | "/song-modal/$slug";
  navigationParams?: { slug: string };
  modal?: React.ReactNode;
};

export const validateSongBrowserSearch = (
  search: Record<string, unknown>,
): SongBrowserSearchParams => ({
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

const selectClass =
  "h-10 w-full rounded-md border bg-background px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50";
const inputClass =
  "h-10 w-full rounded-md border bg-background px-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50";

export function SongBrowser({
  loaderSongs,
  filterOptions,
  search,
  navigationTarget,
  navigationParams,
  modal,
}: SongBrowserProps) {
  const navigate = useNavigate();
  const { songs: allClientSongs } = useSongs();

  const [searchInput, setSearchInput] = useState(search.q ?? "");
  const deferredSearch = useDeferredValue(searchInput);

  const navigateWithSearch = (
    updater: (prev: SongBrowserSearchParams) => SongBrowserSearchParams,
  ) =>
    void navigate({
      to: navigationTarget,
      params: navigationParams,
      search: (prev) => updater(prev as SongBrowserSearchParams),
      replace: true,
    });

  const searchQuery = deferredSearch.trim();
  useEffect(() => {
    if (searchQuery !== (search.q ?? "")) {
      navigateWithSearch((prev) => ({ ...prev, q: searchQuery || undefined }));
    }
  }, [searchQuery, search.q]);

  const setFilter = <K extends keyof SongBrowserSearchParams>(
    key: K,
    value: SongBrowserSearchParams[K],
  ) => {
    navigateWithSearch((prev) => ({ ...prev, [key]: value }));
  };

  const [filtersOpen, setFiltersOpen] = useState(false);
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

  const clearFilters = () => {
    navigateWithSearch((prev) => ({ q: prev.q }));
  };

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
  }, [isFiltered, allClientSongs, loaderSongs, filters]);

  const isLoading = isFiltered && allSongs === undefined;

  const PAGE_SIZE = 30;
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const songs = allSongs?.slice(0, visibleCount);
  const canLoadMore = allSongs != null && visibleCount < allSongs.length;

  return (
    <main className="mx-auto max-w-5xl flex-1 px-4 pb-12 pt-8">
      <section className="rounded-xl border bg-card p-8 sm:p-12">
        <div className="mb-4 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
            <Music className="h-5 w-5 text-primary" />
          </div>
          <span className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            maimai Song Database
          </span>
        </div>

        <h1 className="mb-3 text-3xl font-bold tracking-tight text-foreground sm:text-5xl">
          Every chart, every song.
        </h1>
        <p className="max-w-2xl text-base text-muted-foreground sm:text-lg">
          Browse the complete maimai song catalog. Explore charts, difficulty levels, BPM, and
          version history — all in one place.
        </p>
      </section>

      <section className="mt-6">
        <div className="relative">
          <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Search song title or alias..."
            className="h-12 w-full rounded-lg border bg-card pl-12 pr-4 text-base text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
          />
          {!allClientSongs && (
            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
              Loading songs...
            </span>
          )}
        </div>

        <button
          type="button"
          onClick={() => setFiltersOpen(!filtersOpen)}
          className="mt-3 flex items-center gap-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
        >
          <SlidersHorizontal className="h-4 w-4" />
          Advanced filters
          {activeFilterCount > 0 && (
            <span className="rounded-full bg-primary px-1.5 py-0.5 text-[10px] font-bold text-primary-foreground">
              {activeFilterCount}
            </span>
          )}
          {filtersOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </button>

        {filtersOpen && (
          <div className="mt-3 grid gap-x-5 gap-y-4 rounded-lg border bg-card p-5 sm:grid-cols-2">
            <FilterField label="Category">
              <select
                value={category}
                onChange={(e) => setFilter("category", e.target.value || undefined)}
                className={selectClass}
              >
                <option value="">All</option>
                {filterOptions.categories.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </FilterField>

            <FilterField label="Version">
              <select
                value={version}
                onChange={(e) => setFilter("version", e.target.value || undefined)}
                className={selectClass}
              >
                <option value="">All</option>
                {filterOptions.versions.map((v) => (
                  <option key={v} value={v}>
                    {v}
                  </option>
                ))}
              </select>
            </FilterField>

            <FilterField label="Difficulty">
              <select
                value={difficulty}
                onChange={(e) => setFilter("difficulty", e.target.value || undefined)}
                className={selectClass}
              >
                <option value="">All</option>
                {filterOptions.difficulties.map((d) => (
                  <option key={d.name} value={d.name}>
                    {d.name}
                  </option>
                ))}
              </select>
            </FilterField>

            <FilterField label="Type">
              <select
                value={type}
                onChange={(e) => setFilter("type", e.target.value || undefined)}
                className={selectClass}
              >
                <option value="">All</option>
                {filterOptions.types.map((t) => (
                  <option key={t.type} value={t.type}>
                    {t.name}
                  </option>
                ))}
              </select>
            </FilterField>

            <FilterField label="Min. Level">
              <input
                type="number"
                value={minLevel ?? ""}
                onChange={(e) =>
                  setFilter("minLevel", e.target.value ? Number(e.target.value) : undefined)
                }
                placeholder="e.g. 1"
                step="0.1"
                className={inputClass}
              />
            </FilterField>
            <FilterField label="Max. Level">
              <input
                type="number"
                value={maxLevel ?? ""}
                onChange={(e) =>
                  setFilter("maxLevel", e.target.value ? Number(e.target.value) : undefined)
                }
                placeholder="e.g. 15"
                step="0.1"
                className={inputClass}
              />
            </FilterField>

            <FilterField label="Min. BPM">
              <input
                type="number"
                value={minBpm ?? ""}
                onChange={(e) =>
                  setFilter("minBpm", e.target.value ? Number(e.target.value) : undefined)
                }
                placeholder="e.g. 55"
                className={inputClass}
              />
            </FilterField>
            <FilterField label="Max. BPM">
              <input
                type="number"
                value={maxBpm ?? ""}
                onChange={(e) =>
                  setFilter("maxBpm", e.target.value ? Number(e.target.value) : undefined)
                }
                placeholder="e.g. 300"
                className={inputClass}
              />
            </FilterField>

            <FilterField label="Region">
              <select
                value={region}
                onChange={(e) => setFilter("region", e.target.value || undefined)}
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
                onChange={(e) => {
                  const value = e.target.value;
                  setFilter("isNew", value === "" ? undefined : value === "true");
                }}
                className={selectClass}
              >
                <option value="">All</option>
                <option value="true">New only</option>
                <option value="false">Not new</option>
              </select>
            </FilterField>

            {activeFilterCount > 0 && (
              <div className="flex items-end sm:col-span-2">
                <button
                  type="button"
                  onClick={clearFilters}
                  className="text-sm font-medium text-primary hover:underline"
                >
                  Clear all filters
                </button>
              </div>
            )}
          </div>
        )}
      </section>

      <section className="mt-10">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="m-0 text-xl font-bold text-foreground">
            {isFiltered ? "Search Results" : "Latest Songs"}
          </h2>
          <span className="text-sm text-muted-foreground">
            {isLoading
              ? "Loading full song list..."
              : allSongs
                ? `${allSongs.length} song${allSongs.length !== 1 ? "s" : ""}`
                : ""}
          </span>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {isLoading
            ? Array.from({ length: 12 }).map((_, i) => <SongCardSkeleton key={i} />)
            : songs && songs.length > 0
              ? songs.map((song) => <SongCard key={song.songId} song={song} />)
              : null}
        </div>

        {canLoadMore && (
          <div className="mt-6 flex justify-center">
            <button
              type="button"
              onClick={() => setVisibleCount((count) => count + PAGE_SIZE)}
              className="rounded-lg border bg-card px-6 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-accent"
            >
              Load more
            </button>
          </div>
        )}

        {!isLoading && allSongs && allSongs.length === 0 && (
          <div className="flex flex-col items-center justify-center rounded-lg border bg-card py-16 text-center">
            <Music className="mb-4 h-12 w-12 text-muted-foreground/40" />
            <p className="m-0 text-lg font-semibold text-foreground">
              {isFiltered ? "No songs match your search" : "No songs found"}
            </p>
            <p className="m-0 mt-1 text-sm text-muted-foreground">
              {isFiltered
                ? "Try a different search term or adjust your filters."
                : "Songs will appear here once the database is populated."}
            </p>
          </div>
        )}
      </section>

      {modal}
    </main>
  );
}

function FilterField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="mb-1.5 block text-xs font-medium text-muted-foreground">{label}</label>
      {children}
    </div>
  );
}

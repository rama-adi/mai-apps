import { createFileRoute, useNavigate } from "@tanstack/react-router";
import type { MaiDbSong, Sheet } from "maidb-data";
import {
  CATEGORY_BY_SLUG,
  DIFFICULTY_COLORS,
  REGION_LABELS,
  VERSION_BY_SLUG,
  filterSongs,
  sortSongsByReleaseDate,
  type SongFilters,
} from "maidb-data";
import { DIFFICULTY_NAMES, TYPE_NAMES } from "maidb-data";
import {
  Music,
  X,
  Zap,
  Check,
  X as XIcon,
  Youtube,
  Share2,
  ClipboardCheck,
  Search,
  SlidersHorizontal,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { useDeferredValue, useEffect, useMemo, useState } from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@packages/ui/components/ui/tabs";
import { SongCard, SongCardSkeleton } from "../components/SongCard";
import { getSongsPageLatest, getSongsPageFilterOptions } from "./-server/songs-index";
import { getSongBySlug } from "./-server/songs";
import { useSongBySlug, useSongs } from "../lib/use-songs";

const THUMBNAIL_BASE = "https://maisongdb-blob.onebyteworks.my.id/thumb";
const REGION_KEYS = ["jp", "intl", "usa", "cn"] as const;
const selectClass =
  "h-10 w-full rounded-md border bg-background px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50";
const inputClass =
  "h-10 w-full rounded-md border bg-background px-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50";

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

function youtubeSearchUrl(query: string) {
  return `https://www.youtube.com/results?search_query=${encodeURIComponent(query).replace(/%20/g, "+")}`;
}

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

export const Route = createFileRoute("/song-modal/$slug")({
  validateSearch: validateSongBrowserSearch,
  loader: async ({ params }) => {
    const [songs, filterOptions, song] = await Promise.all([
      getSongsPageLatest(),
      getSongsPageFilterOptions(),
      getSongBySlug({ data: { slug: params.slug } }),
    ]);
    return { songs, filterOptions, song };
  },
  component: SongModalPage,
});

function SongModalPage() {
  const {
    songs: loaderSongs,
    filterOptions,
    song: loaderSong,
  } = Route.useLoaderData() as {
    songs: MaiDbSong[];
    filterOptions: SongBrowserFilterOptions;
    song: MaiDbSong | null;
  };
  const search = Route.useSearch();
  const { slug } = Route.useParams();
  const navigate = useNavigate({ from: "/song-modal/$slug" });
  const { songs: allClientSongs } = useSongs();
  const clientSong = useSongBySlug(slug);
  const song = clientSong ?? loaderSong;
  const [searchInput, setSearchInput] = useState(search.q ?? "");
  const deferredSearch = useDeferredValue(searchInput);
  const [isClosing, setIsClosing] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(false);

  const navigateWithSearch = (
    updater: (prev: SongBrowserSearchParams) => SongBrowserSearchParams,
  ) =>
    void navigate({
      to: "/song-modal/$slug",
      params: { slug },
      search: (prev) => updater(prev as SongBrowserSearchParams),
      replace: true,
      resetScroll: false,
    });

  const searchQuery = deferredSearch.trim();
  useEffect(() => {
    if (searchQuery !== (search.q ?? "")) {
      navigateWithSearch((prev) => ({ ...prev, q: searchQuery || undefined }));
    }
  }, [navigate, search.q, searchQuery, slug]);

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

  const closeModal = () => {
    if (isClosing) return;
    setIsClosing(true);
    window.setTimeout(() => {
      void navigate({
        to: "/",
        search,
        replace: true,
        resetScroll: false,
      });
    }, 180);
  };

  const clearFilters = () => {
    navigateWithSearch((prev) => ({ q: prev.q }));
  };

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
            onChange={(event) => setSearchInput(event.target.value)}
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
                {filterOptions.difficulties.map((option) => (
                  <option key={option.name} value={option.name}>
                    {option.name}
                  </option>
                ))}
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

            <FilterField label="Min. Level">
              <input
                type="number"
                value={minLevel ?? ""}
                onChange={(event) =>
                  setFilter("minLevel", event.target.value ? Number(event.target.value) : undefined)
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
                onChange={(event) =>
                  setFilter("maxLevel", event.target.value ? Number(event.target.value) : undefined)
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
                onChange={(event) =>
                  setFilter("minBpm", event.target.value ? Number(event.target.value) : undefined)
                }
                placeholder="e.g. 55"
                className={inputClass}
              />
            </FilterField>

            <FilterField label="Max. BPM">
              <input
                type="number"
                value={maxBpm ?? ""}
                onChange={(event) =>
                  setFilter("maxBpm", event.target.value ? Number(event.target.value) : undefined)
                }
                placeholder="e.g. 300"
                className={inputClass}
              />
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
            ? Array.from({ length: 12 }).map((_, index) => <SongCardSkeleton key={index} />)
            : songs && songs.length > 0
              ? songs.map((songCard) => <SongCard key={songCard.songId} song={songCard} />)
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

      {
        <div
          className={`fixed inset-0 z-50 bg-black/70 backdrop-blur-sm duration-200 ${
            isClosing ? "animate-out fade-out-0" : "animate-in fade-in-0"
          }`}
          onClick={closeModal}
        >
          <div
            className={`fixed left-1/2 top-1/2 z-[60] max-h-[85vh] w-[calc(100%-2rem)] max-w-lg -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-3xl border bg-background p-6 shadow-2xl duration-200 ${
              isClosing
                ? "animate-out zoom-out-95 slide-out-to-bottom-4 fade-out-0"
                : "animate-in zoom-in-95 slide-in-from-bottom-4"
            }`}
            onClick={(event) => event.stopPropagation()}
          >
            <button
              type="button"
              aria-label="Close song details"
              className="absolute right-4 top-4 z-10 rounded-full p-2 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
              onClick={closeModal}
            >
              <X className="h-4 w-4" />
            </button>

            <h2 className="sr-only">{song?.title ?? "Song details"}</h2>
            {song ? <SongModalContent song={song} /> : <SongModalSkeleton />}
          </div>
        </div>
      }
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

// ---------------------------------------------------------------------------
// Modal content — consolidated here so everything lives in one route file
// ---------------------------------------------------------------------------

function SongModalContent({ song }: { song: MaiDbSong }) {
  const [imgError, setImgError] = useState(false);
  const thumbnailUrl = song.internalImageId
    ? `${THUMBNAIL_BASE}/${song.internalImageId}.png`
    : null;

  return (
    <div className="space-y-4">
      {/* Song header: image + title/artist */}
      <div className="flex gap-4">
        <div className="flex h-24 w-24 flex-shrink-0 items-center justify-center overflow-hidden rounded-lg bg-muted">
          {thumbnailUrl && !imgError ? (
            <img
              src={thumbnailUrl}
              alt={song.title}
              className="h-full w-full object-cover"
              onError={() => setImgError(true)}
            />
          ) : (
            <Music className="h-10 w-10 text-muted-foreground" />
          )}
        </div>
        <div className="flex min-w-0 flex-1 flex-col justify-center">
          <div className="flex items-start gap-2">
            <h3 className="m-0 text-lg font-bold leading-tight text-foreground">{song.title}</h3>
            {song.isNew && (
              <span className="flex-shrink-0 rounded-full bg-primary px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-primary-foreground">
                New
              </span>
            )}
          </div>
          <p className="m-0 mt-1 text-sm text-muted-foreground">{song.artist}</p>
          <div className="mt-2 flex gap-2">
            <a
              href={youtubeSearchUrl(`${song.title} ${song.artist} maimai`)}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 rounded-md bg-red-600 px-2.5 py-1 text-xs font-semibold text-white transition-colors hover:bg-red-700"
            >
              <Youtube className="h-3.5 w-3.5" />
              YouTube
            </a>
            <ShareButton slug={song.slug} />
          </div>
        </div>
      </div>

      {/* Tabs — right under the song info, before metadata */}
      <Tabs defaultValue="overview" className="flex-col">
        <TabsList className="w-full">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="difficulties">Difficulties</TabsTrigger>
          <TabsTrigger value="availability">Availability</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-4">
          <OverviewTab song={song} />
        </TabsContent>
        <TabsContent value="difficulties" className="mt-4">
          <DifficultiesTab song={song} />
        </TabsContent>
        <TabsContent value="availability" className="mt-4">
          <AvailabilityTab song={song} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

// -- Overview tab -------------------------------------------------------------

function OverviewTab({ song }: { song: MaiDbSong }) {
  const chartTypes = [...new Set(song.sheets.map((s) => s.type))];
  const regions = { jp: false, intl: false, usa: false, cn: false };
  for (const sheet of song.sheets) {
    for (const key of Object.keys(regions) as (keyof typeof regions)[]) {
      if (sheet.regions[key]) regions[key] = true;
    }
  }

  return (
    <div className="space-y-4">
      <LevelGrid song={song} />

      <div className="flex flex-wrap gap-2">
        <MetaPill label="Version" value={VERSION_BY_SLUG[song.version]?.abbr ?? song.version} />
        <MetaPill label="Chart Type" value={chartTypes.map((t) => TYPE_NAMES[t] ?? t).join(", ")} />
        <MetaPill
          label="Category"
          value={CATEGORY_BY_SLUG[song.category]?.category ?? song.category}
        />
      </div>

      <div>
        <p className="m-0 mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Region Availability
        </p>
        <div className="flex gap-2">
          {(Object.entries(regions) as [string, boolean][]).map(([key, available]) => (
            <span
              key={key}
              className={`rounded-md border px-3 py-1 text-xs font-semibold ${
                available
                  ? "border-primary/30 bg-primary/10 text-primary"
                  : "border-muted bg-muted/50 text-muted-foreground line-through opacity-50"
              }`}
            >
              {REGION_LABELS[key] ?? key}
            </span>
          ))}
        </div>
      </div>

      {song.comment && (
        <p className="m-0 rounded-md border bg-muted/30 px-3 py-2 text-sm italic text-muted-foreground">
          {song.comment}
        </p>
      )}
    </div>
  );
}

function LevelGrid({ song }: { song: MaiDbSong }) {
  const sheetsByType = new Map<string, MaiDbSong["sheets"]>();
  for (const sheet of song.sheets) {
    const existing = sheetsByType.get(sheet.type) ?? [];
    existing.push(sheet);
    sheetsByType.set(sheet.type, existing);
  }

  return (
    <div className="space-y-2">
      {[...sheetsByType.entries()].map(([type, sheets]) => (
        <div key={type} className="flex flex-wrap items-center gap-1.5">
          <span className="mr-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            {TYPE_NAMES[type] ?? type}
          </span>
          {sheets
            .sort((a, b) => a.levelValue - b.levelValue)
            .map((sheet, i) => {
              const color = DIFFICULTY_COLORS[sheet.difficulty] ?? "#888";
              return (
                <span
                  key={i}
                  className="inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-xs font-bold text-white"
                  style={{ backgroundColor: color }}
                  title={DIFFICULTY_NAMES[sheet.difficulty] ?? sheet.difficulty}
                >
                  {sheet.level}
                </span>
              );
            })}
        </div>
      ))}
    </div>
  );
}

function MetaPill({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center gap-1.5 rounded-md border bg-card px-2.5 py-1.5">
      <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
        {label}
      </span>
      <span className="text-xs font-medium text-foreground">{value}</span>
    </div>
  );
}

// -- Difficulties tab ---------------------------------------------------------

function DifficultiesTab({ song }: { song: MaiDbSong }) {
  const sheetsByType = new Map<string, Sheet[]>();
  for (const sheet of song.sheets) {
    const existing = sheetsByType.get(sheet.type) ?? [];
    existing.push(sheet);
    sheetsByType.set(sheet.type, existing);
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 rounded-md border bg-card px-3 py-2">
        <Zap className="h-4 w-4 text-primary" />
        <span className="text-sm font-semibold text-foreground">{song.bpm} BPM</span>
      </div>

      {[...sheetsByType.entries()].map(([type, sheets]) => (
        <div key={type}>
          <h4 className="m-0 mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            {TYPE_NAMES[type] ?? type}
          </h4>
          <div className="space-y-1.5">
            {sheets
              .sort((a, b) => a.levelValue - b.levelValue)
              .map((sheet, i) => {
                const diffColor = DIFFICULTY_COLORS[sheet.difficulty] ?? "#888";
                const diffName = DIFFICULTY_NAMES[sheet.difficulty] ?? sheet.difficulty;
                return (
                  <div
                    key={i}
                    className="flex items-center gap-3 rounded-md border bg-card px-3 py-2"
                  >
                    <span
                      className="inline-flex min-w-[4.5rem] items-center justify-center rounded-sm px-2 py-0.5 text-xs font-bold text-white"
                      style={{ backgroundColor: diffColor }}
                    >
                      {diffName}
                    </span>
                    <span className="text-sm font-semibold text-foreground">{sheet.level}</span>
                    {sheet.internalLevelValue > 0 && (
                      <span className="text-xs text-muted-foreground">
                        ({sheet.internalLevelValue})
                      </span>
                    )}
                    {sheet.noteDesigner && (
                      <span className="ml-auto text-xs text-muted-foreground">
                        {sheet.noteDesigner}
                      </span>
                    )}
                    {sheet.noteCounts.total != null && (
                      <span className="text-xs text-muted-foreground">
                        {sheet.noteCounts.total} notes
                      </span>
                    )}
                    <a
                      href={youtubeSearchUrl(`${song.title} maimai ${diffName}`)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="ml-auto flex-shrink-0 rounded p-1 text-red-500 transition-colors hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950"
                      title={`Search YouTube for ${diffName}`}
                    >
                      <Youtube className="h-3.5 w-3.5" />
                    </a>
                  </div>
                );
              })}
          </div>
        </div>
      ))}
    </div>
  );
}

// -- Availability tab ---------------------------------------------------------

function AvailabilityTab({ song }: { song: MaiDbSong }) {
  const sheetsByType = new Map<string, Sheet[]>();
  for (const sheet of song.sheets) {
    const existing = sheetsByType.get(sheet.type) ?? [];
    existing.push(sheet);
    sheetsByType.set(sheet.type, existing);
  }

  return (
    <div className="space-y-4">
      {[...sheetsByType.entries()].map(([type, sheets]) => (
        <div key={type}>
          <h4 className="m-0 mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            {TYPE_NAMES[type] ?? type}
          </h4>
          <div className="overflow-x-auto rounded-md border">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="px-3 py-2 text-left text-xs font-semibold text-muted-foreground">
                    Difficulty
                  </th>
                  {REGION_KEYS.map((r) => (
                    <th
                      key={r}
                      className="px-3 py-2 text-center text-xs font-semibold text-muted-foreground"
                    >
                      {REGION_LABELS[r] ?? r}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {sheets
                  .sort((a, b) => a.levelValue - b.levelValue)
                  .map((sheet, i) => {
                    const diffColor = DIFFICULTY_COLORS[sheet.difficulty] ?? "#888";
                    const diffName = DIFFICULTY_NAMES[sheet.difficulty] ?? sheet.difficulty;
                    return (
                      <tr key={i} className="border-b last:border-b-0">
                        <td className="px-3 py-1.5">
                          <span
                            className="inline-flex min-w-[4rem] items-center justify-center rounded-sm px-2 py-0.5 text-[11px] font-bold text-white"
                            style={{ backgroundColor: diffColor }}
                          >
                            {diffName}
                          </span>
                        </td>
                        {REGION_KEYS.map((r) => (
                          <td key={r} className="px-3 py-1.5 text-center">
                            {sheet.regions[r] ? (
                              <Check className="mx-auto h-4 w-4 text-green-500" />
                            ) : (
                              <XIcon className="mx-auto h-4 w-4 text-muted-foreground/30" />
                            )}
                          </td>
                        ))}
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>
        </div>
      ))}

      <div className="space-y-2">
        <h4 className="m-0 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Additional Info
        </h4>
        <dl className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-sm">
          <dt className="text-muted-foreground">Song ID</dt>
          <dd className="m-0 font-medium text-foreground">{song.songId}</dd>
          <dt className="text-muted-foreground">Locked</dt>
          <dd className="m-0 font-medium text-foreground">{song.isLocked ? "Yes" : "No"}</dd>
          {song.releaseDate && (
            <>
              <dt className="text-muted-foreground">Release Date</dt>
              <dd className="m-0 font-medium text-foreground">{song.releaseDate}</dd>
            </>
          )}
          <dt className="text-muted-foreground">Version</dt>
          <dd className="m-0 font-medium text-foreground">
            {VERSION_BY_SLUG[song.version]?.abbr ?? song.version}
          </dd>
        </dl>
      </div>
    </div>
  );
}

// -- Share button -------------------------------------------------------------

function ShareButton({ slug }: { slug: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    const url = `${window.location.origin}/songs/${slug}`;
    void navigator.clipboard.writeText(url).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <button
      type="button"
      onClick={handleCopy}
      className="inline-flex items-center gap-1.5 rounded-md border bg-card px-2.5 py-1 text-xs font-semibold text-foreground transition-colors hover:bg-accent"
    >
      {copied ? (
        <>
          <ClipboardCheck className="h-3.5 w-3.5 text-green-500" />
          Copied!
        </>
      ) : (
        <>
          <Share2 className="h-3.5 w-3.5" />
          Share
        </>
      )}
    </button>
  );
}

// -- Skeleton -----------------------------------------------------------------

function SongModalSkeleton() {
  return (
    <div className="space-y-4">
      <div className="flex gap-4">
        <div className="h-24 w-24 flex-shrink-0 animate-pulse rounded-lg bg-muted" />
        <div className="flex-1 space-y-2">
          <div className="h-6 w-3/4 animate-pulse rounded bg-muted" />
          <div className="h-4 w-1/2 animate-pulse rounded bg-muted" />
        </div>
      </div>
      <div className="flex gap-1 rounded-full bg-muted p-1">
        <div className="h-8 flex-1 animate-pulse rounded-full bg-muted-foreground/10" />
        <div className="h-8 flex-1 animate-pulse rounded-full bg-muted-foreground/10" />
        <div className="h-8 flex-1 animate-pulse rounded-full bg-muted-foreground/10" />
      </div>
      <div className="flex gap-1.5">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-6 w-10 animate-pulse rounded-md bg-muted" />
        ))}
      </div>
      <div className="flex gap-2">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-8 w-24 animate-pulse rounded-md bg-muted" />
        ))}
      </div>
    </div>
  );
}

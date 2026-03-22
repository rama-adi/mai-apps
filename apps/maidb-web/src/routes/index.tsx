import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "convex/react";
import { api } from "@packages/backend/convex/_generated/api";
import { Music, Search, SlidersHorizontal, ChevronDown, ChevronUp } from "lucide-react";
import { SongCard, SongCardSkeleton } from "../components/SongCard";
import { getLatestSongs, getFilterOptions } from "./index.functions";
import { useState, useDeferredValue } from "react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "MaiDB - Browse the Complete maimai Song Database" },
      {
        name: "description",
        content:
          "Explore every maimai song and chart. Browse difficulty levels, BPM, version history, and more — all in one place.",
      },
      { property: "og:title", content: "MaiDB - maimai Song Database" },
      {
        property: "og:description",
        content:
          "Browse the complete maimai song catalog with charts, difficulties, BPM, and version history.",
      },
    ],
  }),
  loader: async () => {
    const [songs, filterOptions] = await Promise.all([getLatestSongs(), getFilterOptions()]);
    return { songs, filterOptions };
  },
  component: HomePage,
});

const selectClass =
  "h-10 w-full rounded-md border bg-background px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50";
const inputClass =
  "h-10 w-full rounded-md border bg-background px-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50";

function HomePage() {
  const { songs: loaderSongs, filterOptions: loaderFilterOptions } = Route.useLoaderData();

  const liveSongs = useQuery(api.songs.latestSongs);
  const liveFilterOptions = useQuery(api.songs.filterOptions);
  const filterOptions = liveFilterOptions ?? loaderFilterOptions;

  // Search state
  const [searchQuery, setSearchQuery] = useState("");
  const deferredSearch = useDeferredValue(searchQuery);

  // Filter state
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [categoryId, setCategoryId] = useState("");
  const [versionId, setVersionId] = useState("");
  const [difficultyId, setDifficultyId] = useState("");
  const [typeId, setTypeId] = useState("");
  const [region, setRegion] = useState("");
  const [minBpm, setMinBpm] = useState("");
  const [maxBpm, setMaxBpm] = useState("");
  const [minLevel, setMinLevel] = useState("");
  const [maxLevel, setMaxLevel] = useState("");
  const [isNew, setIsNew] = useState<"" | "true" | "false">("");

  const activeFilterCount = [
    categoryId,
    versionId,
    difficultyId,
    typeId,
    region,
    minBpm,
    maxBpm,
    minLevel,
    maxLevel,
    isNew,
  ].filter(Boolean).length;

  const clearFilters = () => {
    setCategoryId("");
    setVersionId("");
    setDifficultyId("");
    setTypeId("");
    setRegion("");
    setMinBpm("");
    setMaxBpm("");
    setMinLevel("");
    setMaxLevel("");
    setIsNew("");
  };

  // Use FTS search when there's a query, otherwise show latest songs
  const searchResults = useQuery(
    api.songs.searchSongs,
    deferredSearch.trim().length > 0
      ? {
          searchQuery: deferredSearch.trim(),
          ...(categoryId ? { categoryId: categoryId as never } : {}),
          ...(versionId ? { versionId: versionId as never } : {}),
          ...(difficultyId ? { difficultyId: difficultyId as never } : {}),
          ...(typeId ? { typeId: typeId as never } : {}),
          ...(region ? { region } : {}),
          ...(minBpm ? { minBpm: Number(minBpm) } : {}),
          ...(maxBpm ? { maxBpm: Number(maxBpm) } : {}),
          ...(minLevel ? { minLevel: Number(minLevel) } : {}),
          ...(maxLevel ? { maxLevel: Number(maxLevel) } : {}),
          ...(isNew ? { isNew: isNew === "true" } : {}),
        }
      : "skip",
  );

  const isSearching = deferredSearch.trim().length > 0;
  const songs = isSearching ? searchResults : (liveSongs ?? loaderSongs);
  const isLoading = isSearching && searchResults === undefined;

  return (
    <main className="mx-auto max-w-5xl flex-1 px-4 pb-12 pt-8">
      {/* Hero */}
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

      {/* Search bar */}
      <section className="mt-6">
        <div className="relative">
          <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search song title or alias..."
            className="h-12 w-full rounded-lg border bg-card pl-12 pr-4 text-base text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
          />
        </div>

        {/* Advanced filters toggle */}
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

        {/* Filter panel */}
        {filtersOpen && (
          <div className="mt-3 grid gap-x-5 gap-y-4 rounded-lg border bg-card p-5 sm:grid-cols-2">
            {/* Category */}
            <FilterField label="Category">
              <select
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className={selectClass}
              >
                <option value="">All</option>
                {filterOptions.categories.map((c) => (
                  <option key={c._id} value={c._id}>
                    {c.category}
                  </option>
                ))}
              </select>
            </FilterField>

            {/* Version */}
            <FilterField label="Version">
              <select
                value={versionId}
                onChange={(e) => setVersionId(e.target.value)}
                className={selectClass}
              >
                <option value="">All</option>
                {filterOptions.versions.map((v) => (
                  <option key={v._id} value={v._id}>
                    {v.version} ({v.abbr})
                  </option>
                ))}
              </select>
            </FilterField>

            {/* Difficulty */}
            <FilterField label="Difficulty">
              <select
                value={difficultyId}
                onChange={(e) => setDifficultyId(e.target.value)}
                className={selectClass}
              >
                <option value="">All</option>
                {filterOptions.difficulties.map((d) => (
                  <option key={d._id} value={d._id}>
                    {d.name}
                  </option>
                ))}
              </select>
            </FilterField>

            {/* Type */}
            <FilterField label="Type">
              <select
                value={typeId}
                onChange={(e) => setTypeId(e.target.value)}
                className={selectClass}
              >
                <option value="">All</option>
                {filterOptions.types.map((t) => (
                  <option key={t._id} value={t._id}>
                    {t.name} ({t.abbr})
                  </option>
                ))}
              </select>
            </FilterField>

            {/* Level range */}
            <FilterField label="Min. Level">
              <input
                type="number"
                value={minLevel}
                onChange={(e) => setMinLevel(e.target.value)}
                placeholder="e.g. 1"
                step="0.1"
                className={inputClass}
              />
            </FilterField>
            <FilterField label="Max. Level">
              <input
                type="number"
                value={maxLevel}
                onChange={(e) => setMaxLevel(e.target.value)}
                placeholder="e.g. 15"
                step="0.1"
                className={inputClass}
              />
            </FilterField>

            {/* BPM range */}
            <FilterField label="Min. BPM">
              <input
                type="number"
                value={minBpm}
                onChange={(e) => setMinBpm(e.target.value)}
                placeholder="e.g. 55"
                className={inputClass}
              />
            </FilterField>
            <FilterField label="Max. BPM">
              <input
                type="number"
                value={maxBpm}
                onChange={(e) => setMaxBpm(e.target.value)}
                placeholder="e.g. 300"
                className={inputClass}
              />
            </FilterField>

            {/* Region */}
            <FilterField label="Region">
              <select
                value={region}
                onChange={(e) => setRegion(e.target.value)}
                className={selectClass}
              >
                <option value="">All</option>
                {filterOptions.regions.map((r) => (
                  <option key={r._id} value={r.region}>
                    {r.name}
                  </option>
                ))}
              </select>
            </FilterField>

            {/* New status */}
            <FilterField label="Status">
              <select
                value={isNew}
                onChange={(e) => setIsNew(e.target.value as "" | "true" | "false")}
                className={selectClass}
              >
                <option value="">All</option>
                <option value="true">New only</option>
                <option value="false">Not new</option>
              </select>
            </FilterField>

            {/* Clear filters */}
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

      {/* Song list */}
      <section className="mt-10">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="m-0 text-xl font-bold text-foreground">
            {isSearching ? "Search Results" : "Latest Songs"}
          </h2>
          <span className="text-sm text-muted-foreground">
            {isLoading
              ? "Searching..."
              : songs
                ? `${songs.length} song${songs.length !== 1 ? "s" : ""}`
                : ""}
          </span>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {isLoading
            ? Array.from({ length: 12 }).map((_, i) => <SongCardSkeleton key={i} />)
            : songs && songs.length > 0
              ? songs.map((song) => (
                  <SongCard
                    key={song._id}
                    title={song.title}
                    artist={song.artist}
                    bpm={song.bpm}
                    version={song.version}
                    category={song.category}
                    isNew={song.isNew}
                    releaseDate={song.releaseDate}
                    imageName={song.imageName}
                    internalImageId={song.internalImageId}
                  />
                ))
              : null}
        </div>

        {!isLoading && songs && songs.length === 0 && (
          <div className="flex flex-col items-center justify-center rounded-lg border bg-card py-16 text-center">
            <Music className="mb-4 h-12 w-12 text-muted-foreground/40" />
            <p className="m-0 text-lg font-semibold text-foreground">
              {isSearching ? "No songs match your search" : "No songs found"}
            </p>
            <p className="m-0 mt-1 text-sm text-muted-foreground">
              {isSearching
                ? "Try a different search term or adjust your filters."
                : "Songs will appear here once the database is populated."}
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
      <label className="mb-1.5 block text-xs font-medium text-muted-foreground">{label}</label>
      {children}
    </div>
  );
}

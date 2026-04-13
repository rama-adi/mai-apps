import { env } from "cloudflare:workers";
import type { MaiDbSong, Metadata, SongFiltersData } from "maidb-data";

import { buildFilterOptions, sortSongsByReleaseDate, type FilterOptions } from "maidb-data";

type LazyJsonModule<T> = T & { default?: T };

function unwrapLazyJsonModule<T>(mod: LazyJsonModule<T>): T {
  return (typeof mod === "object" && mod != null && "default" in mod ? mod.default : mod) as T;
}

const lazyJson = <T>(loader: () => Promise<LazyJsonModule<T>>) => {
  let cached: T | null = null;
  return async () => {
    if (!cached) cached = unwrapLazyJsonModule(await loader());
    return cached;
  };
};

const loadSongsJson = lazyJson<MaiDbSong[]>(
  () => import("maidb-data/data/songs/songs.json") as Promise<LazyJsonModule<MaiDbSong[]>>,
);
const loadLatestJson = lazyJson<MaiDbSong[]>(
  () => import("maidb-data/data/songs/latest-only.json") as Promise<LazyJsonModule<MaiDbSong[]>>,
);
const loadMetadataJson = lazyJson<Metadata>(
  () => import("maidb-data/data/songs/metadata.json") as Promise<LazyJsonModule<Metadata>>,
);

const SONGS_OBJECT_KEY = "data/songs/songs.json";
const LATEST_OBJECT_KEY = "data/songs/latest-only.json";
const METADATA_OBJECT_KEY = "data/songs/metadata.json";
const CHARTS_OBJECT_KEY = "data/mai-charts/charts.json";

const SONGS_CACHE_KEY = "data/songs/songs.json";
const LATEST_CACHE_KEY = "data/songs/latest-only.json";
const METADATA_CACHE_KEY = "data/songs/metadata.json";
const CHARTS_CACHE_KEY = "data/mai-charts/charts.json";

const JSON_CACHE_TTL_SECONDS = 60 * 60;

type JsonSource = "kv" | "r2" | "local";

type SongListPayload = {
  songs: MaiDbSong[];
  source: JsonSource;
};

type CachedJsonResult<T> = {
  data: T;
  source: JsonSource;
};

function createCachedJsonResource<T>(
  cacheKey: string,
  objectKey: string,
  loadLocal: () => Promise<T>,
) {
  let cachedResultPromise: Promise<CachedJsonResult<T>> | null = null;

  return async () => {
    if (!cachedResultPromise) {
      cachedResultPromise = loadCachedJsonText(cacheKey, objectKey, loadLocal).catch((error) => {
        cachedResultPromise = null;
        throw error;
      });
    }

    return cachedResultPromise;
  };
}

const loadSongListResource = createCachedJsonResource(
  SONGS_CACHE_KEY,
  SONGS_OBJECT_KEY,
  loadSongsJson,
);
const loadLatestSongsResource = createCachedJsonResource(
  LATEST_CACHE_KEY,
  LATEST_OBJECT_KEY,
  loadLatestJson,
);
const loadMetadataResource = createCachedJsonResource(
  METADATA_CACHE_KEY,
  METADATA_OBJECT_KEY,
  loadMetadataJson,
);
const loadChartsResource = createCachedJsonResource(
  CHARTS_CACHE_KEY,
  CHARTS_OBJECT_KEY,
  async () =>
    unwrapLazyJsonModule(await import("maidb-data/data/mai-charts/charts.json")) as Record<
      string,
      MaiNotesEntry
    >,
);

type SongCatalogIndex = {
  bySlug: Map<string, MaiDbSong>;
  bySongId: Map<string, MaiDbSong>;
  byVersion: Map<string, MaiDbSong[]>;
  filterOptions: FilterOptions;
  filtersData: SongFiltersData;
  slugs: string[];
};

let songCatalogIndexPromise: Promise<SongCatalogIndex> | null = null;

async function getSongCatalogIndex(): Promise<SongCatalogIndex> {
  if (!songCatalogIndexPromise) {
    songCatalogIndexPromise = (async () => {
      const { songs } = await loadSongList();
      const bySlug = new Map<string, MaiDbSong>();
      const bySongId = new Map<string, MaiDbSong>();
      const byVersion = new Map<string, MaiDbSong[]>();

      for (const song of songs) {
        bySlug.set(song.slug, song);
        bySongId.set(song.songId, song);
        const songsForVersion = byVersion.get(song.version);
        if (songsForVersion) {
          songsForVersion.push(song);
        } else {
          byVersion.set(song.version, [song]);
        }
      }

      for (const [versionSlug, songsForVersion] of byVersion.entries()) {
        byVersion.set(versionSlug, sortSongsByReleaseDate(songsForVersion));
      }

      return {
        bySlug,
        bySongId,
        byVersion,
        filterOptions: buildFilterOptions(songs),
        filtersData: await buildSongFiltersData(songs),
        slugs: songs.map((song) => song.slug),
      };
    })().catch((error) => {
      songCatalogIndexPromise = null;
      throw error;
    });
  }

  return songCatalogIndexPromise;
}

export async function loadSongList(): Promise<SongListPayload> {
  const songsFromCache = await loadSongListResource();
  return { songs: songsFromCache.data, source: songsFromCache.source };
}

export async function loadSongListResponse(): Promise<Response> {
  const { songs, source } = await loadSongList();

  return new Response(JSON.stringify(songs), {
    headers: {
      "cache-control": "public, max-age=300, s-maxage=3600, stale-while-revalidate=86400",
      "content-type": "application/json; charset=utf-8",
      "x-songlist-source": source,
    },
  });
}

export async function getLatestSongs(): Promise<MaiDbSong[]> {
  return (await loadLatestSongsResource()).data;
}

export async function getMetadata(): Promise<Metadata> {
  return (await loadMetadataResource()).data;
}

export async function getSongsByVersion(versionSlug: string): Promise<MaiDbSong[]> {
  const index = await getSongCatalogIndex();
  return index.byVersion.get(versionSlug) ?? [];
}

export async function getSongBySlug(slug: string): Promise<MaiDbSong | null> {
  const index = await getSongCatalogIndex();
  return index.bySlug.get(slug) ?? null;
}

export async function getAllSlugs(): Promise<string[]> {
  const index = await getSongCatalogIndex();
  return index.slugs;
}

export async function getCounterpartSong(songId: string): Promise<MaiDbSong | null> {
  const index = await getSongCatalogIndex();
  const isUtage = songId.startsWith("_utage_.");
  const counterpartId = isUtage ? songId.slice("_utage_.".length) : `_utage_.${songId}`;
  return index.bySongId.get(counterpartId) ?? null;
}

export async function getFilterOptions(): Promise<FilterOptions> {
  const index = await getSongCatalogIndex();
  return index.filterOptions;
}

export async function getSongFiltersData(): Promise<SongFiltersData> {
  const index = await getSongCatalogIndex();
  return index.filtersData;
}

async function buildSongFiltersData(songs: MaiDbSong[]): Promise<SongFiltersData> {
  const metadata = await getMetadata();

  const categories = new Set<string>();
  const versions = new Set<string>();
  const difficulties = new Set<string>();
  const types = new Set<string>();
  const regions = new Set<string>();
  const levelValues = new Map<string, number>();
  const bpms = new Set<number>();
  const internalLevels = new Set<number>();
  let hasNewSongs = false;
  let hasExistingSongs = false;

  for (const song of songs) {
    categories.add(song.category);
    versions.add(song.version);
    bpms.add(song.bpm);
    if (song.isNew) {
      hasNewSongs = true;
    } else {
      hasExistingSongs = true;
    }

    for (const sheet of song.sheets) {
      difficulties.add(sheet.difficulty);
      types.add(sheet.type);
      if (!levelValues.has(sheet.level)) {
        levelValues.set(sheet.level, sheet.levelValue);
      }
      if (sheet.internalLevelValue > 0) {
        internalLevels.add(sheet.internalLevelValue);
      }
      for (const [region, enabled] of Object.entries(sheet.regions)) {
        if (enabled) {
          regions.add(region);
        }
      }
    }
  }

  const knownCategories = new Set(metadata.categories.map((category) => category.slug));
  const knownVersions = new Set(metadata.versions.map((version) => version.slug));
  const knownDifficulties = new Set(
    metadata.difficulties.map((difficulty) => difficulty.difficulty),
  );
  const knownTypes = new Set(metadata.chart_types.map((type) => type.type));
  const knownRegions = new Set(metadata.regions.map((region) => region.region));
  const sortedBpms = sortNumbers(bpms);
  const sortedInternalLevels = sortNumbers(internalLevels);

  return {
    categories: [
      ...metadata.categories
        .filter((category) => categories.has(category.slug))
        .map((category) => ({
          value: category.slug,
          label: category.category,
        })),
      ...sortStrings([...categories].filter((category) => !knownCategories.has(category))).map(
        (category) => ({
          value: category,
          label: category,
        }),
      ),
    ],
    versions: [
      ...metadata.versions
        .filter((version) => versions.has(version.slug))
        .map((version) => ({
          value: version.slug,
          label: version.abbr,
        })),
      ...sortStrings([...versions].filter((version) => !knownVersions.has(version))).map(
        (version) => ({
          value: version,
          label: version,
        }),
      ),
    ],
    difficulties: [
      ...metadata.difficulties
        .filter((difficulty) => difficulties.has(difficulty.difficulty))
        .map((difficulty) => ({
          value: difficulty.difficulty,
          label: difficulty.name,
          color: difficulty.color,
        })),
      ...sortStrings(
        [...difficulties].filter((difficulty) => !knownDifficulties.has(difficulty)),
      ).map((difficulty) => ({
        value: difficulty,
        label: difficulty,
        color: "#888",
      })),
    ],
    types: [
      ...metadata.chart_types
        .filter((type) => types.has(type.type))
        .map((type) => ({
          value: type.type,
          label: type.abbr ?? type.name,
        })),
      ...sortStrings([...types].filter((type) => !knownTypes.has(type))).map((type) => ({
        value: type,
        label: type,
      })),
    ],
    internalLevelRange: {
      min: sortedInternalLevels[0] ?? 0,
      max: sortedInternalLevels.at(-1) ?? 0,
      values: sortedInternalLevels,
    },
    levels: [...levelValues.entries()]
      .sort((a, b) => a[1] - b[1] || a[0].localeCompare(b[0]))
      .map(([level]) => level),
    bpmRange: {
      min: sortedBpms[0] ?? 0,
      max: sortedBpms.at(-1) ?? 0,
      values: sortedBpms,
    },
    regions: [
      ...metadata.regions
        .filter((region) => regions.has(region.region))
        .map((region) => ({
          value: region.region,
          label: region.label,
        })),
      ...sortStrings([...regions].filter((region) => !knownRegions.has(region))).map((region) => ({
        value: region,
        label: region.toUpperCase(),
      })),
    ],
    statuses: [
      ...(hasNewSongs ? [{ value: "new", label: "New" }] : []),
      ...(hasExistingSongs ? [{ value: "existing", label: "Existing" }] : []),
    ],
  };
}

function sortNumbers(values: Iterable<number>): number[] {
  return [...values].sort((a, b) => a - b);
}

function sortStrings(values: Iterable<string>): string[] {
  return [...values].sort((a, b) => a.localeCompare(b));
}

export type MaiNotesChart = {
  id: string;
  difficulty: string;
  level: string;
  internal_level: number;
  version: string;
  release_date: string;
  notes_designer: string | null;
  has_chart_data: boolean;
};

export type MaiNotesEntry = {
  title: string;
  simai_id: string;
  gamerch_id: string;
  charts: MaiNotesChart[];
};

async function loadChartsData(): Promise<Record<string, MaiNotesEntry>> {
  return (await loadChartsResource()).data;
}

async function loadCachedJsonText<T>(
  cacheKey: string,
  objectKey: string,
  loadLocal: () => Promise<T>,
): Promise<CachedJsonResult<T>> {
  const cachedText = await env.MAIAPP_SONGS_CACHE?.get(cacheKey, "text");
  if (cachedText != null) {
    return { data: JSON.parse(cachedText) as T, source: "kv" };
  }

  const r2Object = await env.SONG_DATA_BUCKET?.get(objectKey);
  if (r2Object != null) {
    const text = await r2Object.text();
    if (env.MAIAPP_SONGS_CACHE) {
      await env.MAIAPP_SONGS_CACHE.put(cacheKey, text, {
        expirationTtl: JSON_CACHE_TTL_SECONDS,
      });
    }
    return { data: JSON.parse(text) as T, source: "r2" };
  }

  return { data: await loadLocal(), source: "local" };
}

export async function getMaiNotesCharts(slug: string): Promise<MaiNotesEntry | null> {
  const data = await loadChartsData();
  return data[slug] ?? null;
}

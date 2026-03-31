import { env } from "cloudflare:workers";
import type { MaiDbSong, Metadata, SongFiltersData } from "maidb-data";

import {
  buildFilterOptions,
  CHART_TYPES,
  CATEGORIES,
  DIFFICULTIES,
  REGIONS,
  sortSongsByReleaseDate,
  type FilterOptions,
  VERSIONS,
} from "maidb-data";

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

const SONGS_OBJECT_KEY = "songs/songs.json";
const LATEST_OBJECT_KEY = "songs/latest-only.json";
const METADATA_OBJECT_KEY = "songs/metadata.json";
const CHARTS_OBJECT_KEY = "mai-charts/charts.json";

const SONGS_CACHE_KEY = "songs/songs.json";
const LATEST_CACHE_KEY = "songs/latest-only.json";
const METADATA_CACHE_KEY = "songs/metadata.json";
const CHARTS_CACHE_KEY = "mai-charts/charts.json";

const JSON_CACHE_TTL_SECONDS = 60 * 60;

type SongListPayload = {
  songs: MaiDbSong[];
  source: "kv" | "r2" | "local";
};

export async function loadSongList(): Promise<SongListPayload> {
  const songsFromCache = await loadCachedJsonText<MaiDbSong[]>(
    SONGS_CACHE_KEY,
    SONGS_OBJECT_KEY,
    loadSongsJson,
  );
  if (songsFromCache.source !== "local") {
    return { songs: songsFromCache.data, source: songsFromCache.source };
  }

  return { songs: songsFromCache.data, source: "local" };
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
  return loadCachedJson(LATEST_CACHE_KEY, LATEST_OBJECT_KEY, loadLatestJson);
}

export async function getMetadata(): Promise<Metadata> {
  return loadCachedJson(METADATA_CACHE_KEY, METADATA_OBJECT_KEY, loadMetadataJson);
}

export async function getSongsByVersion(versionSlug: string): Promise<MaiDbSong[]> {
  const { songs } = await loadSongList();
  return sortSongsByReleaseDate(songs.filter((song) => song.version === versionSlug));
}

export async function getSongBySlug(slug: string): Promise<MaiDbSong | null> {
  const { songs } = await loadSongList();
  return songs.find((song) => song.slug === slug) ?? null;
}

export async function getAllSlugs(): Promise<string[]> {
  const { songs } = await loadSongList();
  return songs.map((song) => song.slug);
}

export async function getFilterOptions(): Promise<FilterOptions> {
  const { songs } = await loadSongList();
  return buildFilterOptions(songs);
}

export async function getSongFiltersData(): Promise<SongFiltersData> {
  const { songs } = await loadSongList();
  return buildSongFiltersData(songs);
}

function buildSongFiltersData(songs: MaiDbSong[]): SongFiltersData {
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

  const knownCategories = new Set(CATEGORIES.map((category) => category.category));
  const knownVersions = new Set(VERSIONS.map((version) => version.version));
  const knownDifficulties = new Set(DIFFICULTIES.map((difficulty) => difficulty.difficulty));
  const knownTypes = new Set(CHART_TYPES.map((type) => type.type));
  const knownRegions = new Set(REGIONS.map((region) => region.region));
  const sortedBpms = sortNumbers(bpms);
  const sortedInternalLevels = sortNumbers(internalLevels);

  return {
    categories: [
      ...CATEGORIES.filter((category) => categories.has(category.category)).map((category) => ({
        value: category.category,
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
      ...VERSIONS.filter((version) => versions.has(version.version)).map((version) => ({
        value: version.version,
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
      ...DIFFICULTIES.filter((difficulty) => difficulties.has(difficulty.difficulty)).map(
        (difficulty) => ({
          value: difficulty.difficulty,
          label: difficulty.name,
          color: difficulty.color,
        }),
      ),
      ...sortStrings(
        [...difficulties].filter((difficulty) => !knownDifficulties.has(difficulty)),
      ).map((difficulty) => ({
        value: difficulty,
        label: difficulty,
        color: "#888",
      })),
    ],
    types: [
      ...CHART_TYPES.filter((type) => types.has(type.type)).map((type) => ({
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
      ...REGIONS.filter((region) => regions.has(region.region)).map((region) => ({
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

let chartsData: Record<string, MaiNotesEntry> | null = null;

async function loadChartsData(): Promise<Record<string, MaiNotesEntry>> {
  if (!chartsData) {
    chartsData = await loadCachedJson(
      CHARTS_CACHE_KEY,
      CHARTS_OBJECT_KEY,
      async () =>
        unwrapLazyJsonModule(await import("maidb-data/data/mai-charts/charts.json")) as Record<
          string,
          MaiNotesEntry
        >,
    );
  }
  return chartsData;
}

async function loadCachedJson<T>(
  cacheKey: string,
  objectKey: string,
  loadLocal: () => Promise<T>,
): Promise<T> {
  const result = await loadCachedJsonText(cacheKey, objectKey, loadLocal);
  return result.data;
}

async function loadCachedJsonText<T>(
  cacheKey: string,
  objectKey: string,
  loadLocal: () => Promise<T>,
): Promise<{ data: T; source: "kv" | "r2" | "local" }> {
  const cachedText = await env.MAIAPP_SONGS_CACHE.get(cacheKey, "text");
  if (cachedText) {
    return { data: JSON.parse(cachedText) as T, source: "kv" };
  }

  const r2Object = await env.SONG_DATA_BUCKET.get(objectKey);
  if (r2Object) {
    const text = await r2Object.text();
    await env.MAIAPP_SONGS_CACHE.put(cacheKey, text, {
      expirationTtl: JSON_CACHE_TTL_SECONDS,
    });
    return { data: JSON.parse(text) as T, source: "r2" };
  }

  return { data: await loadLocal(), source: "local" };
}

export async function getMaiNotesCharts(slug: string): Promise<MaiNotesEntry | null> {
  const data = await loadChartsData();
  return data[slug] ?? null;
}

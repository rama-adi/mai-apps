import type { MaiDbSong } from "../types/song.js";
import type { FilterOptions, SongFilters } from "../types/filters.js";
import { DIFFICULTY_COLORS, DIFFICULTY_NAMES, TYPE_NAMES } from "../constants.js";
import Fuse, { type IFuseOptions } from "fuse.js";

export type { FilterOptions, SongFilters };

// -- Sorting ------------------------------------------------------------------

function compareReleaseDatesDesc(a: MaiDbSong, b: MaiDbSong): number {
  if (a.releaseDate == null && b.releaseDate == null) return 0;
  if (a.releaseDate == null) return 1;
  if (b.releaseDate == null) return -1;
  return b.releaseDate.localeCompare(a.releaseDate);
}

export function sortSongsByReleaseDate(songs: MaiDbSong[]): MaiDbSong[] {
  return [...songs].sort(compareReleaseDatesDesc);
}

export { TYPE_NAMES, DIFFICULTY_NAMES };

// -- Filter options -----------------------------------------------------------

export function buildFilterOptions(songs: MaiDbSong[]): FilterOptions {
  const categories = new Set<string>();
  const versions = new Set<string>();
  const difficulties = new Set<string>();
  const types = new Set<string>();

  for (const song of songs) {
    categories.add(song.category);
    versions.add(song.version);
    for (const sheet of song.sheets) {
      difficulties.add(sheet.difficulty);
      types.add(sheet.type);
    }
  }

  return {
    categories: [...categories].sort(),
    versions: [...versions],
    difficulties: [...difficulties].map((d) => ({
      name: d,
      color: DIFFICULTY_COLORS[d] ?? "#888",
    })),
    types: [...types].map((t) => ({
      type: t,
      name: TYPE_NAMES[t] ?? t,
    })),
  };
}

// -- Client-side filtering ----------------------------------------------------

const SONG_SEARCH_OPTIONS = {
  ignoreLocation: true,
  includeScore: true,
  keys: [{ name: "keyword", weight: 1 }],
  threshold: 0.2,
} satisfies IFuseOptions<MaiDbSong>;

export function searchSongsByKeyword(songs: MaiDbSong[], query: string): MaiDbSong[] {
  const trimmedQuery = query.trim();
  if (!trimmedQuery) return songs;

  const fuse = new Fuse(songs, SONG_SEARCH_OPTIONS);
  return sortSongsByReleaseDate(fuse.search(trimmedQuery).map((result) => result.item));
}

function isBrowsableSheet(sheet: MaiDbSong["sheets"][number]): boolean {
  return sheet.type !== "utage" && !sheet.isSpecial;
}

function matchesSheetFilters(sheet: MaiDbSong["sheets"][number], filters: SongFilters): boolean {
  if (!isBrowsableSheet(sheet)) return false;
  if (filters.difficulty && sheet.difficulty !== filters.difficulty) return false;
  if (filters.type && sheet.type !== filters.type) return false;
  if (filters.region) {
    const region = filters.region as keyof typeof sheet.regions;
    if (!sheet.regions[region]) return false;
  }
  if (filters.minLevel != null && sheet.levelValue < filters.minLevel) return false;
  if (filters.maxLevel != null && sheet.levelValue > filters.maxLevel) return false;
  if (filters.minInternalLevel != null) {
    if (sheet.internalLevelValue <= 0 || sheet.internalLevelValue < filters.minInternalLevel) {
      return false;
    }
  }
  if (filters.maxInternalLevel != null) {
    if (sheet.internalLevelValue <= 0 || sheet.internalLevelValue > filters.maxInternalLevel) {
      return false;
    }
  }

  return true;
}

function getClosestLevelDistance(song: MaiDbSong, filters: SongFilters): number {
  let minDistance = Number.POSITIVE_INFINITY;
  for (const sh of song.sheets) {
    if (
      !matchesSheetFilters(sh, {
        difficulty: filters.difficulty,
        type: filters.type,
        region: filters.region,
      })
    ) {
      continue;
    }

    const candidates = [
      {
        active: filters.minLevel != null || filters.maxLevel != null,
        min: filters.minLevel,
        max: filters.maxLevel,
        value: sh.levelValue,
      },
      {
        active: filters.minInternalLevel != null || filters.maxInternalLevel != null,
        min: filters.minInternalLevel,
        max: filters.maxInternalLevel,
        value: sh.internalLevelValue,
        skip: sh.internalLevelValue <= 0,
      },
    ];

    let distance = 0;
    let hasActiveRange = false;

    for (const candidate of candidates) {
      if (!candidate.active) continue;
      if (candidate.skip) {
        distance = Number.POSITIVE_INFINITY;
        hasActiveRange = true;
        break;
      }

      hasActiveRange = true;
      const targetMin = candidate.min ?? -Number.POSITIVE_INFINITY;
      const targetMax = candidate.max ?? Number.POSITIVE_INFINITY;
      const targetCenter =
        candidate.min != null && candidate.max != null
          ? (candidate.min + candidate.max) / 2
          : (candidate.min ?? candidate.max ?? 0);

      if (candidate.value >= targetMin && candidate.value <= targetMax) {
        distance += Math.abs(candidate.value - targetCenter);
      } else if (candidate.value < targetMin) {
        distance += targetMin - candidate.value + 100;
      } else {
        distance += candidate.value - targetMax + 100;
      }
    }

    if (hasActiveRange) {
      minDistance = Math.min(minDistance, distance);
    }
  }

  return minDistance;
}

export function filterSongs(songs: MaiDbSong[], filters: SongFilters): MaiDbSong[] {
  const hasKeyword = Boolean(filters.q?.trim());
  const hasLevelFilter = filters.minLevel != null || filters.maxLevel != null;
  const hasInternalFilter = filters.minInternalLevel != null || filters.maxInternalLevel != null;

  let result = hasKeyword ? searchSongsByKeyword(songs, filters.q!) : [...songs];

  if (filters.category) {
    result = result.filter((s) => s.category === filters.category);
  }
  if (filters.version) {
    result = result.filter((s) => s.version === filters.version);
  }
  if (filters.minBpm != null) {
    result = result.filter((s) => s.bpm >= filters.minBpm!);
  }
  if (filters.maxBpm != null) {
    result = result.filter((s) => s.bpm <= filters.maxBpm!);
  }
  if (filters.difficulty || filters.type || filters.region || hasLevelFilter || hasInternalFilter) {
    result = result.filter((song) =>
      song.sheets.some((sheet) => matchesSheetFilters(sheet, filters)),
    );
  }
  if (filters.isNew != null) {
    result = result.filter((s) => s.isNew === filters.isNew);
  }

  if (!hasKeyword && (hasLevelFilter || hasInternalFilter)) {
    result = [...result].sort((a, b) => {
      const distA = getClosestLevelDistance(a, filters);
      const distB = getClosestLevelDistance(b, filters);
      if (distA !== distB) return distA - distB;
      return compareReleaseDatesDesc(a, b);
    });
  } else if (!hasKeyword) {
    result = sortSongsByReleaseDate(result);
  }

  return result;
}

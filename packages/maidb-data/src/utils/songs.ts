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
  // When explicitly filtering by utage type, include utage sheets
  // Otherwise, exclude utage and special sheets from normal filtering
  if (filters.type !== "utage" && !isBrowsableSheet(sheet)) return false;
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

/**
 * Get the minimum matching value for sorting.
 * Returns the smallest matching BPM, level, or internal level value.
 */
function getMinMatchingValue(song: MaiDbSong, filters: SongFilters): number {
  let minValue = Number.POSITIVE_INFINITY;
  let hasActiveFilter = false;

  // Check BPM filters
  if (filters.minBpm != null || filters.maxBpm != null) {
    hasActiveFilter = true;
    const bpmMin = filters.minBpm ?? -Number.POSITIVE_INFINITY;
    const bpmMax = filters.maxBpm ?? Number.POSITIVE_INFINITY;
    if (song.bpm >= bpmMin && song.bpm <= bpmMax) {
      minValue = Math.min(minValue, song.bpm);
    }
  }

  // Check level/internal filters on sheets
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

    // Check level filter
    if (filters.minLevel != null || filters.maxLevel != null) {
      hasActiveFilter = true;
      const lvlMin = filters.minLevel ?? -Number.POSITIVE_INFINITY;
      const lvlMax = filters.maxLevel ?? Number.POSITIVE_INFINITY;
      if (sh.levelValue >= lvlMin && sh.levelValue <= lvlMax) {
        minValue = Math.min(minValue, sh.levelValue);
      }
    }

    // Check internal level filter
    if (filters.minInternalLevel != null || filters.maxInternalLevel != null) {
      if (sh.internalLevelValue > 0) {
        hasActiveFilter = true;
        const intMin = filters.minInternalLevel ?? -Number.POSITIVE_INFINITY;
        const intMax = filters.maxInternalLevel ?? Number.POSITIVE_INFINITY;
        if (sh.internalLevelValue >= intMin && sh.internalLevelValue <= intMax) {
          minValue = Math.min(minValue, sh.internalLevelValue);
        }
      }
    }
  }

  return hasActiveFilter ? minValue : Number.POSITIVE_INFINITY;
}

export function filterSongs(songs: MaiDbSong[], filters: SongFilters): MaiDbSong[] {
  const hasKeyword = Boolean(filters.q?.trim());
  const hasLevelFilter = filters.minLevel != null || filters.maxLevel != null;
  const hasInternalFilter = filters.minInternalLevel != null || filters.maxInternalLevel != null;
  const hasBpmFilter = filters.minBpm != null || filters.maxBpm != null;
  const hasActiveRangeFilter = hasLevelFilter || hasInternalFilter || hasBpmFilter;

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

  // Sort by smallest matching value when range filters are applied
  if (hasActiveRangeFilter) {
    result = [...result].sort((a, b) => {
      const minA = getMinMatchingValue(a, filters);
      const minB = getMinMatchingValue(b, filters);
      if (minA !== minB) return minA - minB;
      // If no keyword search, fall back to release date for tie-breaking
      if (!hasKeyword) {
        return compareReleaseDatesDesc(a, b);
      }
      return 0;
    });
  } else if (!hasKeyword) {
    // No range filters and no keyword: sort by release date
    result = sortSongsByReleaseDate(result);
  }

  return result;
}

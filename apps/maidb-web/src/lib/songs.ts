import type { MaiDbSong } from "maidb-data";
import { DIFFICULTY_COLORS } from "maidb-data";

import allSongs from "maidb-data/songs.json";

const songs = allSongs as MaiDbSong[];

// -- Build-time / server-side helpers -----------------------------------------

function compareReleaseDatesDesc(a: MaiDbSong, b: MaiDbSong): number {
  if (a.releaseDate == null && b.releaseDate == null) return 0;
  if (a.releaseDate == null) return 1;
  if (b.releaseDate == null) return -1;
  return b.releaseDate.localeCompare(a.releaseDate);
}

export function sortSongsByReleaseDate(songs: MaiDbSong[]): MaiDbSong[] {
  return [...songs].sort(compareReleaseDatesDesc);
}

export function getLatestSongs(limit = 50): MaiDbSong[] {
  return sortSongsByReleaseDate(songs).slice(0, limit);
}

export function getSongBySlug(slug: string): MaiDbSong | null {
  return songs.find((s) => s.slug === slug) ?? null;
}

export function getAllSlugs(): string[] {
  return songs.map((s) => s.slug);
}

export type FilterOptions = {
  categories: string[];
  versions: string[];
  difficulties: { name: string; color: string }[];
  types: { type: string; name: string }[];
};

export function getFilterOptions(): FilterOptions {
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

// -- Display mappings ---------------------------------------------------------

export const TYPE_NAMES: Record<string, string> = {
  std: "Standard",
  dx: "Deluxe",
  utage: "Utage",
};

export const DIFFICULTY_NAMES: Record<string, string> = {
  basic: "Basic",
  advanced: "Advanced",
  expert: "Expert",
  master: "Master",
  remaster: "Re:Master",
  utage: "Utage",
};

// -- Client-side filtering ----------------------------------------------------

export type SongFilters = {
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

export function filterSongs(songs: MaiDbSong[], filters: SongFilters): MaiDbSong[] {
  let result = songs;

  if (filters.q) {
    const q = filters.q.toLowerCase();
    result = result.filter((s) => s.keyword.toLowerCase().includes(q));
  }
  if (filters.category) {
    result = result.filter((s) => s.category === filters.category);
  }
  if (filters.version) {
    result = result.filter((s) => s.version === filters.version);
  }
  if (filters.difficulty) {
    const d = filters.difficulty;
    result = result.filter((s) => s.sheets.some((sh) => sh.difficulty === d));
  }
  if (filters.type) {
    const t = filters.type;
    result = result.filter((s) => s.sheets.some((sh) => sh.type === t));
  }
  if (filters.region) {
    const r = filters.region as keyof MaiDbSong["sheets"][number]["regions"];
    result = result.filter((s) => s.sheets.some((sh) => sh.regions[r]));
  }
  if (filters.minBpm != null) {
    result = result.filter((s) => s.bpm >= filters.minBpm!);
  }
  if (filters.maxBpm != null) {
    result = result.filter((s) => s.bpm <= filters.maxBpm!);
  }
  if (filters.minLevel != null) {
    const min = filters.minLevel;
    result = result.filter((s) => s.sheets.some((sh) => sh.levelValue >= min));
  }
  if (filters.maxLevel != null) {
    const max = filters.maxLevel;
    result = result.filter((s) => s.sheets.some((sh) => sh.levelValue <= max));
  }
  if (filters.isNew != null) {
    result = result.filter((s) => s.isNew === filters.isNew);
  }

  return result;
}

import type { FilterOptions } from "maidb-data";

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

export type SongBrowserFilterOptions = FilterOptions;

export function validateSongBrowserSearch(
  search: Record<string, unknown>,
): SongBrowserSearchParams {
  return {
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
  };
}

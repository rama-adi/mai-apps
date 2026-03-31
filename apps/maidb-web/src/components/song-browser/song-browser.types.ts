import type { SongFiltersData } from "maidb-data";

export type SongBrowserSearchParams = {
  from?: string;
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
  minInternalLevel?: number;
  maxInternalLevel?: number;
  useChartConstant?: boolean;
  isNew?: boolean;
};

export type SongBrowserFilterOptions = SongFiltersData;

export function validateSongBrowserSearch(
  search: Record<string, unknown>,
): SongBrowserSearchParams {
  return {
    from: typeof search.from === "string" ? search.from : undefined,
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
    minInternalLevel:
      typeof search.minInternalLevel === "number" ? search.minInternalLevel : undefined,
    maxInternalLevel:
      typeof search.maxInternalLevel === "number" ? search.maxInternalLevel : undefined,
    useChartConstant:
      typeof search.useChartConstant === "boolean" ? search.useChartConstant : undefined,
    isNew: typeof search.isNew === "boolean" ? search.isNew : undefined,
  };
}

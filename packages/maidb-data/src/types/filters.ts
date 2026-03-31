export type FilterOption = {
  value: string;
  label: string;
};

export type RangeFilter = {
  min: number;
  max: number;
  values: number[];
};

export type SongFiltersData = {
  categories: FilterOption[];
  versions: FilterOption[];
  difficulties: (FilterOption & { color: string })[];
  types: FilterOption[];
  internalLevelRange: RangeFilter;
  levels: string[];
  bpmRange: RangeFilter;
  regions: FilterOption[];
  statuses: FilterOption[];
};

export type FilterOptions = {
  categories: string[];
  versions: string[];
  difficulties: { name: string; color: string }[];
  types: { type: string; name: string }[];
};

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
  minInternalLevel?: number;
  maxInternalLevel?: number;
  isNew?: boolean;
};

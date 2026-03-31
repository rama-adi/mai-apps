export type Category = { category: string; color: string; slug: string };
export type Version = { version: string; abbr: string; releaseDate: string; slug: string };
export type ChartType = {
  type: string;
  name: string;
  abbr: string;
  iconUrl?: string;
  iconHeight?: number;
};
export type Difficulty = { difficulty: string; name: string; color: string };
export type Region = { region: string; name: string; label: string };

export type Metadata = {
  categories: Category[];
  versions: Version[];
  chart_types: ChartType[];
  difficulties: Difficulty[];
  regions: Region[];
};

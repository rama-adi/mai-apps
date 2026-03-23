export const SONG_DATA_URL = "https://dp4p6x0xfi5o9.cloudfront.net/maimai/data.json";
export const ALIASES_URL =
  "https://raw.githubusercontent.com/lomotos10/GCM-bot/refs/heads/main/data/aliases/en/maimai.tsv";
export const COVER_BASE_URL = "https://dp4p6x0xfi5o9.cloudfront.net/maimai/img/cover/";

// -- Structured game metadata -------------------------------------------------
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

export const CATEGORIES: Category[] = [
  { category: "POPS＆アニメ", color: "#ff972a", slug: "pops-anime" },
  { category: "niconico＆ボーカロイド", color: "#08c8d3", slug: "niconico-vocaloid" },
  { category: "東方Project", color: "#ad59ed", slug: "touhou" },
  { category: "ゲーム＆バラエティ", color: "#4be071", slug: "game-variety" },
  { category: "maimai", color: "#f64849", slug: "maimai" },
  { category: "オンゲキ＆CHUNITHM", color: "#3583fe", slug: "ongeki-chunithm" },
  { category: "宴会場", color: "#888888", slug: "utage" },
];

export const VERSIONS: Version[] = [
  { version: "maimai", abbr: "maimai (真)", releaseDate: "2012-07-11", slug: "maimai" },
  { version: "maimai PLUS", abbr: "maimai+ (真)", releaseDate: "2012-12-13", slug: "maimai-plus" },
  { version: "GreeN", abbr: "GreeN (超)", releaseDate: "2013-07-11", slug: "green" },
  { version: "GreeN PLUS", abbr: "GreeN+ (檄)", releaseDate: "2014-02-26", slug: "green-plus" },
  { version: "ORANGE", abbr: "ORANGE (橙)", releaseDate: "2014-09-18", slug: "orange" },
  { version: "ORANGE PLUS", abbr: "ORANGE+ (暁)", releaseDate: "2015-03-19", slug: "orange-plus" },
  { version: "PiNK", abbr: "PiNK (桃)", releaseDate: "2015-12-09", slug: "pink" },
  { version: "PiNK PLUS", abbr: "PiNK+ (舞)", releaseDate: "2016-06-30", slug: "pink-plus" },
  { version: "MURASAKi", abbr: "MURASAKi (紫)", releaseDate: "2016-12-15", slug: "murasaki" },
  {
    version: "MURASAKi PLUS",
    abbr: "MURASAKi+ (菫)",
    releaseDate: "2017-06-22",
    slug: "murasaki-plus",
  },
  { version: "MiLK", abbr: "MiLK (白)", releaseDate: "2017-12-14", slug: "milk" },
  { version: "MiLK PLUS", abbr: "MiLK+ (雪)", releaseDate: "2018-06-21", slug: "milk-plus" },
  { version: "FiNALE", abbr: "FiNALE (輝)", releaseDate: "2018-12-13", slug: "finale" },
  { version: "maimaiでらっくす", abbr: "でらっくす (熊)", releaseDate: "2019-07-11", slug: "dx" },
  {
    version: "maimaiでらっくす PLUS",
    abbr: "でらっくす+ (華)",
    releaseDate: "2020-01-23",
    slug: "dx-plus",
  },
  { version: "Splash", abbr: "Splash (爽)", releaseDate: "2020-09-17", slug: "dx-splash" },
  {
    version: "Splash PLUS",
    abbr: "Splash+ (煌)",
    releaseDate: "2021-03-18",
    slug: "dx-splash-plus",
  },
  { version: "UNiVERSE", abbr: "UNiVERSE (宙)", releaseDate: "2021-09-16", slug: "dx-universe" },
  {
    version: "UNiVERSE PLUS",
    abbr: "UNiVERSE+ (星)",
    releaseDate: "2022-03-24",
    slug: "dx-universe-plus",
  },
  { version: "FESTiVAL", abbr: "FESTiVAL (祭)", releaseDate: "2022-09-15", slug: "dx-festival" },
  {
    version: "FESTiVAL PLUS",
    abbr: "FESTiVAL+ (祝)",
    releaseDate: "2023-03-23",
    slug: "dx-festival-plus",
  },
  { version: "BUDDiES", abbr: "BUDDiES (双)", releaseDate: "2023-09-14", slug: "dx-buddies" },
  {
    version: "BUDDiES PLUS",
    abbr: "BUDDiES+ (宴)",
    releaseDate: "2024-03-21",
    slug: "dx-buddies-plus",
  },
  { version: "PRiSM", abbr: "PRiSM (鏡)", releaseDate: "2024-09-12", slug: "dx-prism" },
  {
    version: "PRiSM PLUS",
    abbr: "PRiSM+ (彩)",
    releaseDate: "2025-03-13",
    slug: "dx-prism-plus",
  },
  { version: "CiRCLE", abbr: "CiRCLE (丸)", releaseDate: "2025-09-18", slug: "dx-circle" },
  {
    version: "CiRCLE PLUS",
    abbr: "CiRCLE+",
    releaseDate: "2026-03-19",
    slug: "dx-circle-plus",
  },
];

export const CHART_TYPES: ChartType[] = [
  { type: "dx", name: "DX（でらっくす）", abbr: "DX", iconUrl: "type-dx.png", iconHeight: 22 },
  {
    type: "std",
    name: "STD（スタンダード）",
    abbr: "STD",
    iconUrl: "type-std.png",
    iconHeight: 22,
  },
  { type: "utage", name: "宴（宴会場）", abbr: "宴" },
];

export const DIFFICULTIES: Difficulty[] = [
  { difficulty: "basic", name: "BASIC", color: "#22bb5b" },
  { difficulty: "advanced", name: "ADVANCED", color: "#fb9c2d" },
  { difficulty: "expert", name: "EXPERT", color: "#f64861" },
  { difficulty: "master", name: "MASTER", color: "#9e45e2" },
  { difficulty: "remaster", name: "Re:MASTER", color: "#ba67f8" },
];

export const REGIONS: Region[] = [
  { region: "jp", name: "日本版", label: "JP" },
  { region: "intl", name: "海外版 (International ver.)", label: "INTL" },
  { region: "usa", name: "アメリカ海外版 (USA International ver.)", label: "USA" },
  { region: "cn", name: "中国版 (舞萌DX)", label: "CN" },
];

// Exported metadata:
export type Metadata = {
  categories: Category[];
  versions: Version[];
  chart_types: ChartType[];
  difficulties: Difficulty[];
  regions: Region[];
};

export const EXPORTED_METADATA: Metadata = {
  categories: CATEGORIES,
  versions: VERSIONS,
  chart_types: CHART_TYPES,
  difficulties: DIFFICULTIES,
  regions: REGIONS,
};

// -- Derived lookup maps (convenience) ----------------------------------------

export const DIFFICULTY_COLORS: Record<string, string> = Object.fromEntries(
  DIFFICULTIES.map((d) => [d.difficulty, d.color]),
);

export const DIFFICULTY_NAMES: Record<string, string> = Object.fromEntries(
  DIFFICULTIES.map((d) => [d.difficulty, d.name]),
);

export const TYPE_NAMES: Record<string, string> = Object.fromEntries(
  CHART_TYPES.map((t) => [t.type, t.abbr]),
);

export const REGION_LABELS: Record<string, string> = Object.fromEntries(
  REGIONS.map((r) => [r.region, r.label]),
);

// Slug-to-display-name maps (for resolving slugs in finalized song data)
export const CATEGORY_BY_SLUG: Record<string, Category> = Object.fromEntries(
  CATEGORIES.map((c) => [c.slug, c]),
);

export const VERSION_BY_SLUG: Record<string, Version> = Object.fromEntries(
  VERSIONS.map((v) => [v.slug, v]),
);

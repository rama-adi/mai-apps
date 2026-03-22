import { writeFileSync, mkdirSync } from "fs";
import { join } from "path";
import { SCRATCH_DIR } from "./shared/paths.js";

const SONG_DATA_URL = "https://dp4p6x0xfi5o9.cloudfront.net/maimai/data.json";
const ALIASES_URL =
  "https://raw.githubusercontent.com/lomotos10/GCM-bot/refs/heads/main/data/aliases/en/maimai.tsv";

function normalizeTitle(title: string): string {
  return title
    .replace("[宴]", "")
    .replace("(宴)", "")
    .trim()
    .toLowerCase()
    .replace(/[^\w\s]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function isUtage(category: string): boolean {
  return category === "宴会場";
}

function transformSheet(s: any) {
  return {
    type: s.type,
    difficulty: s.difficulty,
    level: s.level,
    levelValue: s.levelValue,
    internalLevel: s.internalLevel,
    internalLevelValue: s.internalLevelValue,
    noteDesigner: s.noteDesigner,
    noteCounts: {
      tap: s.noteCounts.tap,
      hold: s.noteCounts.hold,
      slide: s.noteCounts.slide,
      touch: s.noteCounts.touch,
      break: s.noteCounts.break,
      total: s.noteCounts.total,
    },
    regions: {
      jp: s.regions.jp,
      intl: s.regions.intl,
      usa: s.regions.usa,
      cn: s.regions.cn,
    },
    regionOverrides: {
      intl: s.regionOverrides?.intl?.version ? { version: s.regionOverrides.intl.version } : {},
    },
    isSpecial: s.isSpecial,
    ...(s.version !== undefined ? { version: s.version } : {}),
  };
}

function transformSong(raw: any) {
  return {
    songId: raw.songId,
    category: raw.category,
    title: raw.title,
    artist: raw.artist,
    bpm: raw.bpm,
    imageName: raw.imageName,
    version: raw.version,
    releaseDate: raw.releaseDate,
    isNew: raw.isNew,
    isLocked: raw.isLocked,
    comment: raw.comment,
    internalImageId: null,
  };
}

async function main() {
  console.log("Fetching song data and aliases...");
  const [songData, aliasesTsv] = await Promise.all([
    fetch(SONG_DATA_URL).then((r) => r.json()) as Promise<any>,
    fetch(ALIASES_URL).then((r) => r.text()),
  ]);

  // Parse aliases TSV: song name <tab> alias1 <tab> alias2 ...
  const aliasMap = new Map<string, string[]>();
  for (const line of aliasesTsv.split("\n")) {
    if (!line.trim()) continue;
    const parts = line.split("\t");
    aliasMap.set(parts[0], parts.slice(1).filter(Boolean));
  }

  // Separate regular and utage songs
  const regularSongs: any[] = [];
  const utageSongs: any[] = [];
  for (const song of songData.songs) {
    (isUtage(song.category) ? utageSongs : regularSongs).push(song);
  }

  // Index regular songs by normalized title for utage matching
  const titleIndex = new Map<string, any>();
  for (const song of regularSongs) {
    const n = normalizeTitle(song.title);
    if (!titleIndex.has(n)) titleIndex.set(n, song);
  }

  // Match utage songs to their regular counterparts
  const utageSheetsBySongId = new Map<string, any[]>();
  const utageTitlesBySongId = new Map<string, string[]>();
  const unmatchedUtage: any[] = [];

  for (const u of utageSongs) {
    const matched = titleIndex.get(normalizeTitle(u.title));
    if (matched) {
      const sheets = utageSheetsBySongId.get(matched.songId) ?? [];
      sheets.push(...u.sheets);
      utageSheetsBySongId.set(matched.songId, sheets);

      const titles = utageTitlesBySongId.get(matched.songId) ?? [];
      if (u.title !== matched.title) titles.push(u.title);
      utageTitlesBySongId.set(matched.songId, titles);
    } else {
      unmatchedUtage.push(u);
    }
  }

  console.log(
    `${regularSongs.length} regular, ${utageSongs.length} utage ` +
      `(${utageSongs.length - unmatchedUtage.length} matched, ${unmatchedUtage.length} unmatched)`,
  );

  // Build all songs: regular (with merged utage sheets) + unmatched utage as standalone
  const allSongs = [
    ...regularSongs.map((raw) => ({
      raw,
      extraSheets: utageSheetsBySongId.get(raw.songId) ?? [],
      extraTitles: utageTitlesBySongId.get(raw.songId) ?? [],
    })),
    ...unmatchedUtage.map((raw) => ({
      raw,
      extraSheets: [] as any[],
      extraTitles: [] as string[],
    })),
  ];

  // Write JSONL — one line per song with sheets + keyword
  mkdirSync(SCRATCH_DIR, { recursive: true });

  const lines: string[] = [];
  for (const { raw, extraSheets, extraTitles } of allSongs) {
    const song = transformSong(raw);
    const sheets = [
      ...raw.sheets.map((s: any) => transformSheet(s)),
      ...extraSheets.map((s: any) => transformSheet(s)),
    ];

    const aliases = aliasMap.get(raw.title) ?? [];
    const utageAliases = extraTitles.flatMap((t) => aliasMap.get(t) ?? []);
    const keyword = [raw.title, ...extraTitles, ...aliases, ...utageAliases].join("\t");

    lines.push(JSON.stringify({ song, sheets, keyword }));
  }

  const songsPath = join(SCRATCH_DIR, "songs.jsonl");
  writeFileSync(songsPath, lines.join("\n") + "\n");
  console.log(`Wrote ${lines.length} songs to ${songsPath}`);

  // Write metadata (lookup tables with extra info like colors, abbreviations, etc.)
  const metadataPath = join(SCRATCH_DIR, "metadata.json");
  writeFileSync(
    metadataPath,
    JSON.stringify(
      {
        categories: songData.categories,
        versions: songData.versions,
        types: songData.types,
        difficulties: songData.difficulties,
        regions: songData.regions,
      },
      null,
      2,
    ) + "\n",
  );
  console.log(`Wrote metadata to ${metadataPath}`);

  console.log("Done!");
}

main().catch(console.error);

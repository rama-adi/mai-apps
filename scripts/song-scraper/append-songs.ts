import { readFileSync, writeFileSync, existsSync } from "fs";
import { SONG_DATA_URL, ALIASES_URL } from "maidb-data";
import { SONGS_JSON_PATH } from "./shared/paths.js";
import type { MaiDbSong } from "maidb-data";

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

async function main() {
  console.log("Fetching song data and aliases...");
  const [songData, aliasesTsv] = await Promise.all([
    fetch(SONG_DATA_URL).then((r) => r.json()) as Promise<any>,
    fetch(ALIASES_URL).then((r) => r.text()),
  ]);

  // Parse aliases TSV
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

  // Build all upstream songs
  const allUpstream = [
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

  // Load existing songs.json
  let existing: MaiDbSong[] = [];
  if (existsSync(SONGS_JSON_PATH)) {
    const raw = readFileSync(SONGS_JSON_PATH, "utf-8").trim();
    if (raw.length > 0) {
      existing = JSON.parse(raw);
    }
  }

  const existingById = new Map<string, MaiDbSong>();
  for (const song of existing) {
    existingById.set(song.songId, song);
  }

  // Diff: find new songs and update isNew/sheets for existing ones
  let added = 0;
  let updated = 0;

  for (const { raw, extraSheets, extraTitles } of allUpstream) {
    const sheets = [
      ...raw.sheets.map((s: any) => transformSheet(s)),
      ...extraSheets.map((s: any) => transformSheet(s)),
    ];

    const aliases = aliasMap.get(raw.title) ?? [];
    const utageAliases = extraTitles.flatMap((t) => aliasMap.get(t) ?? []);
    const keyword = [raw.title, ...extraTitles, ...aliases, ...utageAliases].join("\t");

    const prev = existingById.get(raw.songId);
    if (prev) {
      // Update mutable fields only — preserve slug and internalImageId
      prev.isNew = raw.isNew;
      prev.isLocked = raw.isLocked;
      prev.sheets = sheets;
      prev.keyword = keyword;
      updated++;
    } else {
      // New song — append
      existing.push({
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
        slug: null as unknown as string, // filled by create-slugs
        internalImageId: null as unknown as string, // filled by create-image-assets
        sheets,
        keyword,
      });
      added++;
    }
  }

  writeFileSync(SONGS_JSON_PATH, JSON.stringify(existing, null, 2) + "\n");
  console.log(
    `Done: ${added} new songs appended, ${updated} existing songs refreshed, ${existing.length} total`,
  );
}

main().catch(console.error);

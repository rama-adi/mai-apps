import { readFileSync, writeFileSync, existsSync } from "fs";
import { SONG_DATA_URL, ALIASES_URL } from "maidb-data";
import { SONGS_JSON_PATH } from "./shared/paths.js";
import type { MaiDbSong } from "maidb-data";

function stripUtageLevelPrefix(title: string, sheets: any[]): string {
  // Method 1: derive prefix from sheet difficulty, e.g. "【宴】" -> "[宴]"
  for (const sheet of sheets) {
    const m = sheet.difficulty?.match(/^【(.*?)】/);
    if (m) {
      const prefix = `[${m[1]}]`;
      if (title.startsWith(prefix)) {
        return title.slice(prefix.length).trim();
      }
    }
  }
  // Method 2: strip any leading [xxx] prefix (for utage with regular difficulty names)
  return title.replace(/^\[.*?\]/, "").trim();
}

function normalizeTitle(title: string): string {
  return title
    .trim()
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, "")
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

  // Group utage songs by their matched regular counterpart
  const utageGroups = new Map<string, any[]>();
  const unmatchedUtage: any[] = [];

  for (const u of utageSongs) {
    const cleanTitle = stripUtageLevelPrefix(u.title, u.sheets);
    const matched = titleIndex.get(normalizeTitle(cleanTitle));
    if (matched) {
      const group = utageGroups.get(matched.songId) ?? [];
      group.push(u);
      utageGroups.set(matched.songId, group);
    } else {
      unmatchedUtage.push(u);
    }
  }

  if (unmatchedUtage.length > 0) {
    console.log("Unmatched utage songs:");
    for (const u of unmatchedUtage) {
      console.log(`  [${u.songId}] ${u.title}`);
    }
  }

  console.log(
    `${regularSongs.length} regular, ${utageSongs.length} utage ` +
      `(${utageSongs.length - unmatchedUtage.length} matched, ${unmatchedUtage.length} unmatched)`,
  );

  // Build all upstream entries
  type UpstreamEntry = { songId: string; raw: any; sheets: any[]; keyword: string };
  const allUpstream: UpstreamEntry[] = [];

  // Regular songs (no utage sheets mixed in)
  for (const raw of regularSongs) {
    const aliases = aliasMap.get(raw.title) ?? [];
    allUpstream.push({
      songId: raw.songId,
      raw,
      sheets: raw.sheets.map((s: any) => transformSheet(s)),
      keyword: [raw.title, ...aliases].join("\t"),
    });
  }

  // Matched utage — one entry per regular song, prefixed _utage_.<regularSongId>
  for (const [regularSongId, songs] of utageGroups) {
    const first = songs[0];
    const allSheets = songs.flatMap((u: any) => u.sheets.map((s: any) => transformSheet(s)));
    const allTitles = [...new Set(songs.map((u: any) => u.title))];
    const allAliases = allTitles.flatMap((t: string) => aliasMap.get(t) ?? []);
    allUpstream.push({
      songId: `_utage_.${regularSongId}`,
      raw: first,
      sheets: allSheets,
      keyword: [...allTitles, ...allAliases].join("\t"),
    });
  }

  // Unmatched utage — each gets its own prefixed entry
  for (const u of unmatchedUtage) {
    const aliases = aliasMap.get(u.title) ?? [];
    allUpstream.push({
      songId: `_utage_.${u.songId}`,
      raw: u,
      sheets: u.sheets.map((s: any) => transformSheet(s)),
      keyword: [u.title, ...aliases].join("\t"),
    });
  }

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

  for (const { songId, raw, sheets, keyword } of allUpstream) {
    const prev = existingById.get(songId);
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
        songId,
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

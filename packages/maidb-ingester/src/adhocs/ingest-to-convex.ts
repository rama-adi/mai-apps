import { api } from "@packages/backend/convex/_generated/api";
import { readFileSync } from "fs";
import { join } from "path";
import { SCRATCH_DIR } from "../shared/paths.js";
import { createConvexClient } from "../shared/convex.js";

const BATCH_SIZE = 25;

interface Lookups {
  categoryMap: Record<string, string>;
  versionMap: Record<string, string>;
  typeMap: Record<string, string>;
  difficultyMap: Record<string, string>;
  regionMap: Record<string, string>;
}

interface RawEntry {
  song: any;
  sheets: any[];
  keyword: string;
}

function transformSheet(s: any, lookups: Lookups) {
  return {
    typeId: lookups.typeMap[s.type],
    difficultyId: lookups.difficultyMap[s.difficulty],
    level: s.level,
    levelValue: s.levelValue,
    internalLevel: s.internalLevel,
    internalLevelValue: s.internalLevelValue,
    noteDesigner: s.noteDesigner,
    noteCounts: s.noteCounts,
    regions: s.regions,
    regionOverrides: s.regionOverrides,
    isSpecial: s.isSpecial,
    ...(s.version !== undefined ? { versionId: lookups.versionMap[s.version] } : {}),
  };
}

function transformSong(song: any, lookups: Lookups) {
  return {
    songId: song.songId,
    categoryId: lookups.categoryMap[song.category],
    title: song.title,
    artist: song.artist,
    bpm: song.bpm,
    imageName: song.imageName,
    versionId: lookups.versionMap[song.version],
    releaseDate: song.releaseDate,
    isNew: song.isNew,
    isLocked: song.isLocked,
    comment: song.comment,
    internalImageId: song.internalImageId,
  };
}

async function main() {
  const { client, seedSecret } = createConvexClient();

  // Read JSONL and metadata
  const metadata = JSON.parse(readFileSync(join(SCRATCH_DIR, "metadata.json"), "utf-8"));
  const entries: RawEntry[] = readFileSync(join(SCRATCH_DIR, "songs.jsonl"), "utf-8")
    .trim()
    .split("\n")
    .map((line) => JSON.parse(line));

  console.log(`Read ${entries.length} songs from JSONL`);

  // Pre-scan JSONL for lookup values missing from metadata
  // (utage sheets may have types/difficulties not in the top-level metadata)
  const knownCategories = new Set(metadata.categories.map((c: any) => c.category));
  const knownVersions = new Set(metadata.versions.map((v: any) => v.version));
  const knownTypes = new Set(metadata.types.map((t: any) => t.type));
  const knownDifficulties = new Set(metadata.difficulties.map((d: any) => d.difficulty));

  for (const { song, sheets } of entries) {
    if (!knownCategories.has(song.category)) {
      metadata.categories.push({ category: song.category });
      knownCategories.add(song.category);
    }
    if (!knownVersions.has(song.version)) {
      metadata.versions.push({
        version: song.version,
        abbr: song.version,
        releaseDate: "",
      });
      knownVersions.add(song.version);
    }
    for (const sheet of sheets) {
      if (!knownTypes.has(sheet.type)) {
        metadata.types.push({
          type: sheet.type,
          name: sheet.type,
          abbr: sheet.type,
        });
        knownTypes.add(sheet.type);
      }
      if (!knownDifficulties.has(sheet.difficulty)) {
        metadata.difficulties.push({
          difficulty: sheet.difficulty,
          name: sheet.difficulty,
          color: "#000000",
        });
        knownDifficulties.add(sheet.difficulty);
      }
      if (sheet.version && !knownVersions.has(sheet.version)) {
        metadata.versions.push({
          version: sheet.version,
          abbr: sheet.version,
          releaseDate: "",
        });
        knownVersions.add(sheet.version);
      }
    }
  }

  // Seed lookup tables and get ID mappings
  console.log("Seeding lookup tables...");
  const raw = await client.mutation(api.seed.seedLookups, {
    secret: seedSecret,
    categories: metadata.categories,
    versions: metadata.versions,
    types: metadata.types,
    difficulties: metadata.difficulties,
    regions: metadata.regions,
  });

  const toRecord = (tuples: Array<[string, string]>): Record<string, string> =>
    Object.fromEntries(tuples);

  const lookups: Lookups = {
    categoryMap: toRecord(raw.categoryEntries),
    versionMap: toRecord(raw.versionEntries),
    typeMap: toRecord(raw.typeEntries),
    difficultyMap: toRecord(raw.difficultyEntries),
    regionMap: toRecord(raw.regionEntries),
  };

  console.log(
    `Lookups seeded: ${raw.categoryEntries.length} categories, ` +
      `${raw.versionEntries.length} versions, ` +
      `${raw.typeEntries.length} types, ` +
      `${raw.difficultyEntries.length} difficulties, ` +
      `${raw.regionEntries.length} regions`,
  );

  // Transform all entries (resolve string refs → Convex IDs)
  const resolved = entries.map(({ song, sheets, keyword }) => ({
    song: transformSong(song, lookups),
    sheets: sheets.map((s) => transformSheet(s, lookups)),
    keyword,
  }));

  // Send in batches
  for (let i = 0; i < resolved.length; i += BATCH_SIZE) {
    const batch = resolved.slice(i, i + BATCH_SIZE);
    await client.mutation(api.seed.upsertSongBatch, {
      secret: seedSecret,
      entries: batch,
    });

    const done = Math.min(i + BATCH_SIZE, resolved.length);
    console.log(`Progress: ${done}/${resolved.length}`);
  }

  console.log("Done!");
}

main().catch(console.error);

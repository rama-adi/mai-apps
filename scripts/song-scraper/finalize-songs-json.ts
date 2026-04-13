import { readFileSync, writeFileSync, existsSync } from "fs";
import {
  SONGS_JSON_PATH,
  RECEIPTS_PATH,
  METADATA_JSON_PATH,
  LATEST_JSON_PATH,
} from "./shared/paths.js";
import { CATEGORIES, VERSIONS, EXPORTED_METADATA } from "maidb-data";
import type { MaiDbSong, Receipt } from "maidb-data";

const categorySlugMap = new Map(CATEGORIES.map((c) => [c.category, c.slug]));
const versionSlugMap = new Map(VERSIONS.map((v) => [v.version, v.slug]));

async function main() {
  if (!existsSync(SONGS_JSON_PATH)) {
    console.error("songs.json not found");
    process.exit(1);
  }

  const songs: MaiDbSong[] = JSON.parse(readFileSync(SONGS_JSON_PATH, "utf-8"));

  // Merge receipts into songs.json (write internalImageId from uploaded receipts)
  if (existsSync(RECEIPTS_PATH)) {
    const receipts: Receipt[] = JSON.parse(readFileSync(RECEIPTS_PATH, "utf-8"));
    const uploadedReceipts = receipts.filter((r) => r.isUploaded);

    const receiptBySongId = new Map<string, Receipt>();
    for (const r of uploadedReceipts) {
      receiptBySongId.set(r.songId, r);
    }

    let merged = 0;
    for (const song of songs) {
      if (song.internalImageId) continue;
      const receipt = receiptBySongId.get(song.songId);
      if (receipt) {
        song.internalImageId = receipt.internalId;
        merged++;
      }
    }

    console.log(`Merged ${merged} image IDs from receipts`);
  }

  // Validation report
  const missingSlug = songs.filter((s) => !s.slug);
  const missingImage = songs.filter((s) => !s.internalImageId);

  if (missingSlug.length > 0) {
    console.warn(`WARNING: ${missingSlug.length} songs missing slugs`);
  }
  if (missingImage.length > 0) {
    console.warn(`WARNING: ${missingImage.length} songs missing internalImageId`);
  }

  // Replace category/version with slugs
  const unknownCategories = new Set<string>();
  const unknownVersions = new Set<string>();

  for (const song of songs) {
    const catSlug = categorySlugMap.get(song.category);
    if (catSlug) {
      song.category = catSlug;
    } else {
      unknownCategories.add(song.category);
    }

    const verSlug = versionSlugMap.get(song.version);
    if (verSlug) {
      song.version = verSlug;
    } else {
      unknownVersions.add(song.version);
    }
  }

  if (unknownCategories.size > 0) {
    console.warn(`WARNING: Unknown categories: ${[...unknownCategories].join(", ")}`);
  }
  if (unknownVersions.size > 0) {
    console.warn(`WARNING: Unknown versions: ${[...unknownVersions].join(", ")}`);
  }

  // Write songs.json
  writeFileSync(SONGS_JSON_PATH, JSON.stringify(songs, null, 2) + "\n");
  console.log(`Finalized songs.json: ${songs.length} songs`);

  // Write metadata.json
  writeFileSync(METADATA_JSON_PATH, JSON.stringify(EXPORTED_METADATA, null, 2) + "\n");
  console.log(`Wrote metadata.json`);

  // Write latest-only.json (isNew songs only)
  const latestSongs = songs.filter((s) => s.isNew);
  writeFileSync(LATEST_JSON_PATH, JSON.stringify(latestSongs, null, 2) + "\n");
  console.log(`Wrote latest-only.json: ${latestSongs.length} songs`);
}

main().catch(console.error);

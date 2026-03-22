import { readFileSync, writeFileSync, existsSync } from "fs";
import { SONGS_JSON_PATH, RECEIPTS_PATH } from "../shared/paths.js";
import type { MaiDbSong, Receipt } from "../schema.js";

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

    // Index by imageName — multiple songs can share the same image
    const receiptByImage = new Map<string, Receipt>();
    for (const r of uploadedReceipts) {
      receiptByImage.set(r.imageName, r);
    }

    let merged = 0;
    for (const song of songs) {
      if (song.internalImageId) continue;
      const receipt = receiptByImage.get(song.imageName);
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

  writeFileSync(SONGS_JSON_PATH, JSON.stringify(songs, null, 2) + "\n");
  console.log(`Finalized songs.json: ${songs.length} songs`);
}

main().catch(console.error);

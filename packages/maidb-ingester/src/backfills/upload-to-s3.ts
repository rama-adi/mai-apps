import { PutObjectCommand } from "@aws-sdk/client-s3";
import { readFileSync, writeFileSync, existsSync } from "fs";
import { join } from "path";
import { THUMB_DIR, OG_DIR, SONGS_PATH, BACKFILL_RECEIPTS_PATH } from "../shared/paths.js";
import { createS3Client } from "../shared/s3.js";
import type { Receipt } from "../shared/types.js";

const { s3, bucket: S3_BUCKET } = createS3Client();

async function main() {
  const args = process.argv.slice(2);
  const concurrencyIdx = args.indexOf("--concurrency");
  const concurrency = concurrencyIdx !== -1 ? parseInt(args[concurrencyIdx + 1]) : 10;

  if (!existsSync(SONGS_PATH)) {
    console.error("songs.jsonl not found");
    process.exit(1);
  }
  if (!existsSync(BACKFILL_RECEIPTS_PATH)) {
    console.error(
      "backfill-image-assets-receipts.json not found — run backfills/create-image-assets.ts first",
    );
    process.exit(1);
  }

  console.log("Backfill mode: using backfill-image-assets-receipts.json");

  const receipts: Receipt[] = JSON.parse(readFileSync(BACKFILL_RECEIPTS_PATH, "utf-8"));
  const pending = receipts.filter((r) => !r.isUploaded);

  if (pending.length === 0) {
    console.log("All receipts already uploaded.");
    return;
  }

  console.log(
    `Uploading ${pending.length} of ${receipts.length} receipts (concurrency: ${concurrency})...`,
  );

  // Load songs.jsonl into memory for editing
  const lines = readFileSync(SONGS_PATH, "utf-8").trim().split("\n");
  const songEntries = lines.map((line) => JSON.parse(line));

  // Index songs by imageName for fast lookup (multiple songs can share the same imageName)
  const songsByImageName = new Map<string, any[]>();
  for (const entry of songEntries) {
    const key = entry.song.imageName;
    const arr = songsByImageName.get(key) ?? [];
    arr.push(entry);
    songsByImageName.set(key, arr);
  }

  let uploaded = 0;
  let failed = 0;

  async function uploadReceipt(receipt: Receipt) {
    const { internalId, imageName } = receipt;

    const thumbPath = join(THUMB_DIR, `${internalId}.png`);
    const ogPath = join(OG_DIR, `${internalId}.jpg`);

    if (!existsSync(thumbPath) || !existsSync(ogPath)) {
      throw new Error(`Missing local files for ${internalId}`);
    }

    const thumbData = readFileSync(thumbPath);
    const ogData = readFileSync(ogPath);

    // Upload both in parallel
    await Promise.all([
      s3.send(
        new PutObjectCommand({
          Bucket: S3_BUCKET,
          Key: `thumb/${internalId}.png`,
          Body: thumbData,
          ContentType: "image/png",
        }),
      ),
      s3.send(
        new PutObjectCommand({
          Bucket: S3_BUCKET,
          Key: `og-v1/${internalId}.jpg`,
          Body: ogData,
          ContentType: "image/jpeg",
        }),
      ),
    ]);

    // Mark uploaded
    receipt.isUploaded = true;

    // Update all song entries sharing this imageName
    const matchingSongs = songsByImageName.get(imageName);
    if (matchingSongs) {
      for (const songEntry of matchingSongs) {
        songEntry.song.internalImageId = internalId;
      }
    } else {
      console.warn(`  ⚠ No matching song for imageName: ${imageName}`);
    }

    uploaded++;
  }

  // Process in batches
  for (let i = 0; i < pending.length; i += concurrency) {
    const batch = pending.slice(i, i + concurrency);
    const results = await Promise.allSettled(batch.map(uploadReceipt));

    for (let j = 0; j < results.length; j++) {
      const r = results[j];
      const id = batch[j].internalId;
      if (r.status === "fulfilled") {
        console.log(`[${i + j + 1}/${pending.length}] ${id} ✓`);
      } else {
        console.error(`[${i + j + 1}/${pending.length}] ${id} ✗ ${r.reason}`);
        failed++;
      }
    }

    // Persist progress after each batch
    writeFileSync(BACKFILL_RECEIPTS_PATH, JSON.stringify(receipts, null, 2) + "\n");
    writeFileSync(SONGS_PATH, songEntries.map((e: any) => JSON.stringify(e)).join("\n") + "\n");
  }

  console.log(`\nDone: ${uploaded} uploaded, ${failed} failed`);

  // Report any still not uploaded
  const stillPending = receipts.filter((r) => !r.isUploaded);
  if (stillPending.length > 0) {
    console.log(`\n${stillPending.length} receipts NOT uploaded:`);
    for (const r of stillPending) {
      console.log(`  - ${r.internalId} (${r.imageName})`);
    }
  }
}

main().catch(console.error);

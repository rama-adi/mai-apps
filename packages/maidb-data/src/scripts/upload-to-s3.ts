import { PutObjectCommand } from "@aws-sdk/client-s3";
import { readFileSync, writeFileSync, existsSync } from "fs";
import { join } from "path";
import { THUMB_DIR, OG_DIR, RECEIPTS_PATH } from "../shared/paths.js";
import { createS3Client } from "../shared/s3.js";
import type { Receipt } from "../types/song.js";

const { s3, bucket: S3_BUCKET } = createS3Client();

async function main() {
  const args = process.argv.slice(2);
  const concurrencyIdx = args.indexOf("--concurrency");
  const concurrency = concurrencyIdx !== -1 ? parseInt(args[concurrencyIdx + 1]) : 10;

  if (!existsSync(RECEIPTS_PATH)) {
    console.error("image-assets-receipts.json not found — run create-image-assets first");
    process.exit(1);
  }

  const receipts: Receipt[] = JSON.parse(readFileSync(RECEIPTS_PATH, "utf-8"));
  const pending = receipts.filter((r) => !r.isUploaded);

  if (pending.length === 0) {
    console.log("All receipts already uploaded.");
    return;
  }

  console.log(
    `Uploading ${pending.length} of ${receipts.length} receipts (concurrency: ${concurrency})...`,
  );

  let uploaded = 0;
  let failed = 0;

  async function uploadReceipt(receipt: Receipt) {
    const { internalId } = receipt;

    const thumbPath = join(THUMB_DIR, `${internalId}.png`);
    const ogPath = join(OG_DIR, `${internalId}.jpg`);

    if (!existsSync(thumbPath) || !existsSync(ogPath)) {
      throw new Error(`Missing local files for ${internalId}`);
    }

    const thumbData = readFileSync(thumbPath);
    const ogData = readFileSync(ogPath);

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

    receipt.isUploaded = true;
    uploaded++;
  }

  for (let i = 0; i < pending.length; i += concurrency) {
    const batch = pending.slice(i, i + concurrency);
    const results = await Promise.allSettled(batch.map(uploadReceipt));

    for (let j = 0; j < results.length; j++) {
      const r = results[j];
      const id = batch[j].internalId;
      if (r.status === "fulfilled") {
        console.log(`[${i + j + 1}/${pending.length}] ${id} ok`);
      } else {
        console.error(`[${i + j + 1}/${pending.length}] ${id} FAILED ${r.reason}`);
        failed++;
      }
    }

    // Persist progress after each batch
    writeFileSync(RECEIPTS_PATH, JSON.stringify(receipts, null, 2) + "\n");
  }

  console.log(`Done: ${uploaded} uploaded, ${failed} failed`);
}

main().catch(console.error);

import { api } from "backend/convex/_generated/api";
import { readFileSync, existsSync } from "fs";
import { BACKFILL_INPUT_PATH, RECEIPTS_PATH } from "./shared/paths.js";
import { createConvexClient } from "./shared/convex.js";
import type { Receipt } from "./shared/types.js";

const BATCH_SIZE = 25;

async function main() {
  const { client, seedSecret } = createConvexClient();

  if (!existsSync(BACKFILL_INPUT_PATH)) {
    console.error("backfill-receipts.json not found — run backfill-missing-images.ts first");
    process.exit(1);
  }
  if (!existsSync(RECEIPTS_PATH)) {
    console.error(
      "image-assets-receipts.json not found — run create-image-assets.ts and upload-to-s3.ts first",
    );
    process.exit(1);
  }

  // 1. Read backfill entries (songs missing images, pulled from Convex)
  const backfillEntries: { song: { songId: string; imageName: string } }[] = JSON.parse(
    readFileSync(BACKFILL_INPUT_PATH, "utf-8"),
  );

  if (backfillEntries.length === 0) {
    console.log("No backfill entries.");
    return;
  }

  // 2. Read main receipts and build imageName -> internalId map
  const receipts: Receipt[] = JSON.parse(readFileSync(RECEIPTS_PATH, "utf-8"));
  const imageIdMap = new Map<string, string>();
  for (const r of receipts) {
    if (r.isUploaded) {
      imageIdMap.set(r.imageName, r.internalId);
    }
  }

  // 3. Match backfill songs to their internalId via imageName
  const patches: { songId: string; internalImageId: string }[] = [];
  const unmatched: string[] = [];
  for (const entry of backfillEntries) {
    const internalId = imageIdMap.get(entry.song.imageName);
    if (internalId) {
      patches.push({ songId: entry.song.songId, internalImageId: internalId });
    } else {
      unmatched.push(entry.song.songId);
    }
  }

  if (unmatched.length > 0) {
    console.warn(`${unmatched.length} songs had no matching receipt:`);
    for (const id of unmatched.slice(0, 10)) {
      console.warn(`  - ${id}`);
    }
    if (unmatched.length > 10) console.warn(`  ... and ${unmatched.length - 10} more`);
  }

  if (patches.length === 0) {
    console.log("No matching songs found for backfill.");
    return;
  }

  // 4. Patch Convex
  console.log(`Patching internalImageId for ${patches.length} songs...`);

  for (let i = 0; i < patches.length; i += BATCH_SIZE) {
    const batch = patches.slice(i, i + BATCH_SIZE);
    await client.mutation(api.seed.backfillImageIds, {
      secret: seedSecret,
      patches: batch,
    });

    const done = Math.min(i + BATCH_SIZE, patches.length);
    console.log(`Progress: ${done}/${patches.length}`);
  }

  console.log("Done!");
}

main().catch(console.error);

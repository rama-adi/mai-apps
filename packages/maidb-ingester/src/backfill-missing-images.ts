import { writeFileSync } from "fs";
import { api } from "backend/convex/_generated/api";
import { BACKFILL_INPUT_PATH as BACKFILL_PATH } from "./shared/paths.js";
import { createConvexClient } from "./shared/convex.js";

async function main() {
  const { client, seedSecret } = createConvexClient();

  console.log("Querying Convex for songs missing internalImageId...");
  const missing = await client.query(api.seed.getSongsWithoutImages, {
    secret: seedSecret,
  });

  if (missing.length === 0) {
    console.log("All songs already have internalImageId. Nothing to backfill.");
    return;
  }

  console.log(`Found ${missing.length} songs missing internalImageId`);

  writeFileSync(BACKFILL_PATH, JSON.stringify(missing, null, 2) + "\n");
  console.log(`Wrote ${missing.length} entries to ${BACKFILL_PATH}`);
}

main().catch(console.error);

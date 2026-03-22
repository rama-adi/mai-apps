import { writeFileSync } from "fs";
import { api } from "@packages/backend/convex/_generated/api";
import { SLUGS_BACKFILL_PATH } from "../shared/paths.js";
import { createConvexClient } from "../shared/convex.js";

async function main() {
  const { client, seedSecret } = createConvexClient();

  console.log("Querying Convex for songs without slugs...");
  const entries = await client.query(api.seed.getSongsWithoutSlugs, {
    secret: seedSecret,
  });

  if (entries.length === 0) {
    console.log("All songs already have slugs. Nothing to backfill.");
    return;
  }

  console.log(`Found ${entries.length} songs without slugs`);
  writeFileSync(SLUGS_BACKFILL_PATH, JSON.stringify(entries, null, 2) + "\n");
  console.log(`Wrote receipt to ${SLUGS_BACKFILL_PATH}`);
}

main().catch(console.error);

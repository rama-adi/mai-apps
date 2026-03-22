import { readFileSync, writeFileSync, existsSync } from "fs";
import { api } from "@packages/backend/convex/_generated/api";
import { SLUGS_BACKFILL_PATH } from "../shared/paths.js";
import { createConvexClient } from "../shared/convex.js";

const BATCH_SIZE = 25;

async function main() {
  if (!existsSync(SLUGS_BACKFILL_PATH)) {
    console.error("slugs-backfill-receipts.json not found — run find-missing-slugs.ts first");
    process.exit(1);
  }

  const entries = JSON.parse(readFileSync(SLUGS_BACKFILL_PATH, "utf-8"));
  const pending = entries.filter((e: any) => e.slug && !e.isUpserted);

  if (pending.length === 0) {
    console.log("All entries already upserted.");
    return;
  }

  const { client, seedSecret } = createConvexClient();

  console.log(`Upserting slugs for ${pending.length} songs...`);

  for (let i = 0; i < pending.length; i += BATCH_SIZE) {
    const batch = pending.slice(i, i + BATCH_SIZE);
    await client.mutation(api.seed.backfillSlugs, {
      secret: seedSecret,
      patches: batch.map((e: any) => ({ id: e._id, slug: e.slug })),
    });

    for (const e of batch) {
      e.isUpserted = true;
    }

    // Persist progress after each batch
    writeFileSync(SLUGS_BACKFILL_PATH, JSON.stringify(entries, null, 2) + "\n");

    const done = Math.min(i + BATCH_SIZE, pending.length);
    console.log(`Progress: ${done}/${pending.length}`);
  }

  console.log("Done!");
}

main().catch(console.error);

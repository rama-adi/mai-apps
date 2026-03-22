import { api } from "@packages/backend/convex/_generated/api";
import { ListObjectsV2Command, DeleteObjectsCommand } from "@aws-sdk/client-s3";
import { rmSync, existsSync } from "fs";
import { join } from "path";
import { SCRATCH_DIR } from "./shared/paths.js";
import { createConvexClient } from "./shared/convex.js";
import { createS3Client } from "./shared/s3.js";

const TABLES = [
  "songs",
  "sheets",
  "songKeywords",
  "categories",
  "versions",
  "types",
  "difficulties",
  "regions",
] as const;

// -- Convex -----------------------------------------------------------

async function resetConvex() {
  const { client, seedSecret } = createConvexClient();

  console.log("Clearing all Convex tables...");
  for (const table of TABLES) {
    let total = 0;
    let deleted: number;
    do {
      deleted = await client.mutation(api.seed.clearTable, {
        secret: seedSecret,
        table,
      });
      total += deleted;
      if (deleted > 0) {
        console.log(`  ${table}: deleted ${total} docs...`);
      }
    } while (deleted === 1000);
    console.log(`  ${table}: done (${total} total)`);
  }
  console.log("Convex reset complete.");
}

// -- S3 ---------------------------------------------------------------

async function resetS3() {
  let s3, bucket: string;
  try {
    ({ s3, bucket } = createS3Client());
  } catch {
    console.error("Missing S3 env vars -- skipping S3 reset");
    return;
  }

  console.log("Clearing S3 bucket...");
  let totalDeleted = 0;
  let continuationToken: string | undefined;

  do {
    const list = await s3.send(
      new ListObjectsV2Command({
        Bucket: bucket,
        ContinuationToken: continuationToken,
        MaxKeys: 1000,
      }),
    );

    const objects = list.Contents;
    if (!objects || objects.length === 0) break;

    await s3.send(
      new DeleteObjectsCommand({
        Bucket: bucket,
        Delete: {
          Objects: objects.map((o) => ({ Key: o.Key })),
          Quiet: true,
        },
      }),
    );

    totalDeleted += objects.length;
    console.log(`  deleted ${totalDeleted} objects...`);
    continuationToken = list.IsTruncated ? list.NextContinuationToken : undefined;
  } while (continuationToken);

  console.log(`S3 reset complete: ${totalDeleted} objects deleted.`);
}

// -- Scratch ----------------------------------------------------------

function resetScratch() {
  const files = [
    "songs.jsonl",
    "metadata.json",
    "image-assets-receipts.json",
    "backfill-receipts.json",
    "backfill-image-assets-receipts.json",
  ];
  const dirs = ["thumb", "og-v1"];

  console.log("Clearing scratch directory...");
  for (const f of files) {
    const p = join(SCRATCH_DIR, f);
    if (existsSync(p)) {
      rmSync(p);
      console.log(`  removed ${f}`);
    }
  }
  for (const d of dirs) {
    const p = join(SCRATCH_DIR, d);
    if (existsSync(p)) {
      rmSync(p, { recursive: true });
      console.log(`  removed ${d}/`);
    }
  }
  console.log("Scratch reset complete.");
}

// -- Main -------------------------------------------------------------

async function main() {
  const args = process.argv.slice(2);
  if (!args.includes("--yes")) {
    console.error(
      "This will DELETE all data from Convex, S3, and scratch.\n" + "Run with --yes to confirm.",
    );
    process.exit(1);
  }

  await resetConvex();
  await resetS3();
  resetScratch();

  console.log("\nTotal reset complete.");
}

main().catch(console.error);

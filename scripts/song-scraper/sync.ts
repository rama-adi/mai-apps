import { execSync } from "child_process";
import { join } from "path";

const SCRIPTS_DIR = import.meta.dirname;

const steps = [
  { name: "append-songs", file: "append-songs.ts" },
  { name: "create-slugs", file: "create-slugs.ts" },
  { name: "create-image-assets", file: "create-image-assets.ts" },
  { name: "upload-to-s3", file: "upload-to-s3.ts" },
  { name: "finalize-songs-json", file: "finalize-songs-json.ts" },
];

function main() {
  console.log("=== maidb-data sync ===\n");

  // Forward CLI args (e.g. --concurrency 10) to all scripts
  const extraArgs = process.argv.slice(2).join(" ");

  for (const step of steps) {
    const script = join(SCRIPTS_DIR, step.file);
    console.log(`\n--- [${step.name}] ---`);
    try {
      execSync(`tsx ${script} ${extraArgs}`, {
        stdio: "inherit",
        cwd: SCRIPTS_DIR,
      });
    } catch {
      console.error(`\nFATAL: ${step.name} failed`);
      process.exit(1);
    }
  }

  console.log("\n=== sync complete ===");
}

main();

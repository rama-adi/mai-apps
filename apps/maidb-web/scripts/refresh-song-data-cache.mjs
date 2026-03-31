import { spawn } from "node:child_process";
import { mkdtemp, rm } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";

const CACHE_OBJECTS = [
  "data/songs/songs.json",
  "data/songs/latest-only.json",
  "data/songs/metadata.json",
  "data/mai-charts/charts.json",
];

const tempDir = await mkdtemp(join(tmpdir(), "maidb-song-cache-"));

try {
  for (const objectKey of CACHE_OBJECTS) {
    const tempPath = join(tempDir, objectKey.replaceAll("/", "__"));

    await runWrangler([
      "kv",
      "key",
      "delete",
      objectKey,
      "--binding",
      "MAIAPP_SONGS_CACHE",
      "--remote",
    ]);
    await runWrangler([
      "r2",
      "object",
      "get",
      `maisongdb-data/${objectKey}`,
      "--remote",
      "--file",
      tempPath,
    ]);
    await runWrangler([
      "kv",
      "key",
      "put",
      objectKey,
      "--binding",
      "MAIAPP_SONGS_CACHE",
      "--remote",
      "--path",
      tempPath,
    ]);
  }
} finally {
  await rm(tempDir, { recursive: true, force: true });
}

function runWrangler(args) {
  return new Promise((resolve, reject) => {
    const child = spawn("vp", ["exec", "wrangler", ...args], {
      stdio: "inherit",
      shell: true,
    });

    child.on("exit", (code) => {
      if (code === 0) {
        resolve();
        return;
      }

      reject(new Error(`wrangler ${args.join(" ")} exited with code ${code ?? "unknown"}`));
    });

    child.on("error", reject);
  });
}

import { spawn } from "node:child_process";

const CACHE_KEYS = [
  "songs/songs.json",
  "songs/latest-only.json",
  "songs/metadata.json",
  "mai-charts/charts.json",
];

for (const key of CACHE_KEYS) {
  await runWrangler(["kv", "key", "delete", key, "--binding", "MAIAPP_SONGS_CACHE", "--remote"]);
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

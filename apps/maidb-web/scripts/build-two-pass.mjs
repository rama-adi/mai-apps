import { spawn } from "node:child_process";
import { rm, rename, access, readdir, readFile, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const appRoot = resolve(__dirname, "..");

const SONGS_HTML_DIR = resolve(appRoot, "dist/client/songs");
const SONGS_HTML_TMP = resolve(appRoot, ".seo-songs-tmp");
const CLIENT_ASSETS_DIR = resolve(appRoot, "dist/client/assets");

const HASH_RE = /^(.+)-([A-Za-z0-9_-]{8})(\.[a-z]+)$/;

function nameFromHashed(file) {
  const m = HASH_RE.exec(file);
  return m ? m[1] + m[3] : null;
}

async function* walkHtml(dir) {
  for (const ent of await readdir(dir, { withFileTypes: true })) {
    const p = resolve(dir, ent.name);
    if (ent.isDirectory()) yield* walkHtml(p);
    else if (ent.name.endsWith(".html")) yield p;
  }
}

// Rewrites /assets/<name>-<hash>.<js|css> references in the given HTML tree
// so they point at the current pass-2 chunk hashes.
async function rewriteAssetRefs(htmlDir) {
  const assets = await readdir(CLIENT_ASSETS_DIR);
  const byName = new Map();
  for (const f of assets) {
    const n = nameFromHashed(f);
    if (n) byName.set(n, f);
  }

  const refRe = /\/assets\/([^"'\s)]+?-[A-Za-z0-9_-]{8}\.(?:js|css))/g;
  let rewritten = 0;
  const unmapped = new Set();

  for await (const file of walkHtml(htmlDir)) {
    const text = await readFile(file, "utf8");
    const refs = new Set();
    for (const m of text.matchAll(refRe)) refs.add(m[1]);

    let next = text;
    for (const ref of refs) {
      const name = nameFromHashed(ref);
      if (!name) continue;
      const target = byName.get(name);
      if (!target) {
        unmapped.add(ref);
        continue;
      }
      if (target !== ref) {
        next = next.split(`/assets/${ref}`).join(`/assets/${target}`);
      }
    }

    if (next !== text) {
      await writeFile(file, next);
      rewritten++;
    }
  }

  console.log(`Rewrote asset refs in ${rewritten} HTML file(s).`);
  if (unmapped.size > 0) {
    console.warn(
      `Warning: ${unmapped.size} asset ref(s) had no pass-2 equivalent:`,
      [...unmapped].slice(0, 10),
    );
  }
}

async function pathExists(p) {
  try {
    await access(p);
    return true;
  } catch {
    return false;
  }
}

function run(cmd, args, env = {}) {
  return new Promise((resolvePromise, rejectPromise) => {
    const child = spawn(cmd, args, {
      cwd: appRoot,
      stdio: "inherit",
      env: { ...process.env, ...env },
    });
    child.on("error", rejectPromise);
    child.on("exit", (code) => {
      if (code === 0) resolvePromise();
      else rejectPromise(new Error(`${cmd} ${args.join(" ")} exited with code ${code}`));
    });
  });
}

async function main() {
  // Clean any leftover tmp from a previous failed run.
  if (await pathExists(SONGS_HTML_TMP)) {
    await rm(SONGS_HTML_TMP, { recursive: true, force: true });
  }

  // Pass 1: prerender with SEO data inlined into HTML + dehydrated state.
  console.log("\n== Pass 1: build with SEO inlined ==\n");
  await run("vite", ["build"], { INCLUDE_SEO: "true" });

  if (!(await pathExists(SONGS_HTML_DIR))) {
    throw new Error(`Expected ${SONGS_HTML_DIR} to exist after pass 1`);
  }

  // Stash the SEO-enriched HTML before pass 2 overwrites it.
  await rename(SONGS_HTML_DIR, SONGS_HTML_TMP);

  // Pass 2: clean build without SEO -> Worker bundle has no songs-seo.json bytes.
  console.log("\n== Pass 2: build without SEO (Worker bundle) ==\n");
  await run("vite", ["build"]);

  // Replace pass 2's bare song HTML with pass 1's SEO-rich HTML.
  if (await pathExists(SONGS_HTML_DIR)) {
    await rm(SONGS_HTML_DIR, { recursive: true, force: true });
  }
  await rename(SONGS_HTML_TMP, SONGS_HTML_DIR);

  // Pass 1 HTML embeds chunk hashes from its own build, but pass 2 rewrote
  // dist/client/assets with new hashes. Re-point the SEO-rich HTML at the
  // current chunks so the browser can resolve the dynamic imports.
  console.log("\n== Reconciling asset hashes between passes ==\n");
  await rewriteAssetRefs(SONGS_HTML_DIR);

  console.log("\nTwo-pass build complete.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

import { execSync } from "child_process";
import { readFileSync, writeFileSync, existsSync, mkdirSync } from "fs";
import { join, dirname } from "path";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import { SONG_DATA_URL, CATEGORIES, VERSIONS } from "maidb-data";
import type { MaiDbSong } from "maidb-data";
import {
  SONGS_JSON_PATH,
  METADATA_JSON_PATH,
  FILTERS_JSON_PATH,
  LATEST_JSON_PATH,
} from "./shared/paths.js";
import { createS3Client } from "./shared/s3.js";

const BLOB_BASE = "https://maisongdb-blob.onebyteworks.my.id";
const DEPLOYED_SONGS_URL = `${BLOB_BASE}/data/songs/songs.json`;

const SCRIPTS_DIR = import.meta.dirname;

// Reverse-slug maps: deployed blob stores slugs for category/version, but the
// pipeline scripts (append-songs, finalize) expect the raw label strings.
const categoryBySlug = new Map(CATEGORIES.map((c) => [c.slug, c.category]));
const versionBySlug = new Map(VERSIONS.map((v) => [v.slug, v.version]));

function isUtage(category: string): boolean {
  return category === "宴会場" || category === "utage";
}

function normalizeTitle(title: string): string {
  return title
    .trim()
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, "")
    .replace(/\s+/g, " ")
    .trim();
}

function stripUtageLevelPrefix(title: string, sheets: any[]): string {
  for (const sheet of sheets) {
    const m = sheet.difficulty?.match(/^【(.*?)】/);
    if (m) {
      const prefix = `[${m[1]}]`;
      if (title.startsWith(prefix)) return title.slice(prefix.length).trim();
    }
  }
  return title.replace(/^\[.*?\]/, "").trim();
}

// Mirrors append-songs.ts enumeration so we know what songIds upstream will produce.
function computeUpstreamSongIds(songData: any): Set<string> {
  const regular: any[] = [];
  const utage: any[] = [];
  for (const song of songData.songs) {
    (isUtage(song.category) ? utage : regular).push(song);
  }

  const titleIndex = new Map<string, any>();
  for (const song of regular) {
    const n = normalizeTitle(song.title);
    if (!titleIndex.has(n)) titleIndex.set(n, song);
  }

  const matchedRegularIds = new Set<string>();
  const unmatched: any[] = [];
  for (const u of utage) {
    const cleanTitle = stripUtageLevelPrefix(u.title, u.sheets);
    const matched = titleIndex.get(normalizeTitle(cleanTitle));
    if (matched) matchedRegularIds.add(matched.songId);
    else unmatched.push(u);
  }

  const ids = new Set<string>();
  for (const r of regular) ids.add(r.songId);
  for (const regId of matchedRegularIds) ids.add(`_utage_.${regId}`);
  for (const u of unmatched) ids.add(`_utage_.${u.songId}`);
  return ids;
}

function unSlugInPlace(songs: MaiDbSong[]): void {
  for (const song of songs) {
    const cat = categoryBySlug.get(song.category);
    if (cat) song.category = cat;
    const ver = versionBySlug.get(song.version);
    if (ver) song.version = ver;
  }
}

function runStep(file: string, extraArgs: string[]) {
  const script = join(SCRIPTS_DIR, file);
  const argStr = extraArgs.join(" ");
  console.log(`\n--- [${file}] ---`);
  execSync(`tsx ${script} ${argStr}`, { stdio: "inherit", cwd: SCRIPTS_DIR });
}

async function uploadJson(
  s3: ReturnType<typeof createS3Client>["s3"],
  bucket: string,
  key: string,
  path: string,
) {
  const body = readFileSync(path);
  await s3.send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: body,
      ContentType: "application/json",
      CacheControl: "public, max-age=60",
    }),
  );
  console.log(`  uploaded ${key} (${body.length} bytes)`);
}

async function main() {
  const args = process.argv.slice(2);
  const dryRun = args.includes("--dry-run");
  const skipUpload = args.includes("--skip-upload");
  const pipelineArgs = args.filter((a) => a !== "--dry-run" && a !== "--skip-upload");

  console.log("=== add-missing ===");
  console.log(`Upstream:  ${SONG_DATA_URL}`);
  console.log(`Deployed:  ${DEPLOYED_SONGS_URL}`);

  const [upstreamRes, deployedRes] = await Promise.all([
    fetch(SONG_DATA_URL),
    fetch(DEPLOYED_SONGS_URL),
  ]);
  if (!upstreamRes.ok) throw new Error(`Upstream fetch failed: ${upstreamRes.status}`);
  if (!deployedRes.ok) throw new Error(`Deployed fetch failed: ${deployedRes.status}`);

  const upstream = (await upstreamRes.json()) as any;
  const deployed = (await deployedRes.json()) as MaiDbSong[];

  const upstreamIds = computeUpstreamSongIds(upstream);
  const deployedIds = new Set(deployed.map((s) => s.songId));

  const missing = [...upstreamIds].filter((id) => !deployedIds.has(id));
  const stale = [...deployedIds].filter((id) => !upstreamIds.has(id));
  const brokenImageIds = deployed
    .filter((s) => upstreamIds.has(s.songId) && !s.internalImageId)
    .map((s) => s.songId);

  console.log(
    `\nUpstream: ${upstreamIds.size}  Deployed: ${deployedIds.size}  Missing: ${missing.length}  Stale: ${stale.length}  Broken imageId: ${brokenImageIds.length}`,
  );

  if (missing.length > 0) {
    console.log(`\nMissing songIds (first 30):`);
    for (const id of missing.slice(0, 30)) console.log(`  ${id}`);
    if (missing.length > 30) console.log(`  ... +${missing.length - 30} more`);
  }
  if (brokenImageIds.length > 0) {
    console.log(`\nDeployed songs with null internalImageId (first 30):`);
    for (const id of brokenImageIds.slice(0, 30)) console.log(`  ${id}`);
    if (brokenImageIds.length > 30) console.log(`  ... +${brokenImageIds.length - 30} more`);
  }
  if (stale.length > 0) {
    console.log(`\nNote: ${stale.length} deployed song(s) not in upstream — left untouched.`);
  }

  if (missing.length === 0 && brokenImageIds.length === 0) {
    console.log("\nNothing missing. No action taken.");
    return;
  }

  if (dryRun) {
    console.log("\n--dry-run: stopping before writing any files.");
    return;
  }

  // Replace local songs.json with the deployed baseline (un-slugged) so the
  // append/create-slugs/create-image-assets chain only diffs against what's
  // actually published, preserving existing slugs and internalImageIds.
  console.log(`\nReplacing local songs.json with deployed baseline (${deployed.length} songs)`);
  unSlugInPlace(deployed);
  mkdirSync(dirname(SONGS_JSON_PATH), { recursive: true });
  writeFileSync(SONGS_JSON_PATH, JSON.stringify(deployed, null, 2) + "\n");

  runStep("append-songs.ts", pipelineArgs);
  runStep("create-slugs.ts", pipelineArgs);
  runStep("create-image-assets.ts", pipelineArgs);
  runStep("upload-to-s3.ts", pipelineArgs);
  runStep("finalize-songs-json.ts", pipelineArgs);
  runStep("create-filters.ts", pipelineArgs);

  if (skipUpload) {
    console.log("\n--skip-upload: leaving deployed JSONs untouched.");
    console.log("=== add-missing complete ===");
    return;
  }

  console.log("\n--- [upload final JSONs to R2] ---");
  const { s3, bucket } = createS3Client();
  const uploads: Array<[string, string]> = [
    ["data/songs/songs.json", SONGS_JSON_PATH],
    ["data/songs/metadata.json", METADATA_JSON_PATH],
    ["data/songs/filters.json", FILTERS_JSON_PATH],
    ["data/songs/latest-only.json", LATEST_JSON_PATH],
  ];
  for (const [key, path] of uploads) {
    if (!existsSync(path)) {
      console.warn(`  skip ${key} (missing file: ${path})`);
      continue;
    }
    await uploadJson(s3, bucket, key, path);
  }

  console.log("\n=== add-missing complete ===");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

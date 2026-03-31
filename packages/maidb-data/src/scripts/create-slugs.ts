import { readFileSync, writeFileSync, existsSync } from "fs";
import { ALIASES_URL } from "../constants.js";
import { SONGS_JSON_PATH } from "../shared/paths.js";
import type { MaiDbSong } from "../types/song.js";

function countAlphaChars(s: string): number {
  return (s.match(/[a-zA-Z]/g) ?? []).length;
}

function longestLatinRun(s: string): number {
  let max = 0;
  for (const m of s.matchAll(/[a-zA-Z]+/g)) {
    if (m[0].length > max) max = m[0].length;
  }
  return max;
}

function cleanTitle(s: string): string {
  return s.replace(/^\[宴\]/, "").trim();
}

function slugify(s: string): string {
  return s
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

function slugifyArtist(s: string): string {
  const base = s.replace(/\s*feat\..*$/i, "").trim();
  if (longestLatinRun(base) < 6) return "";
  const slug = slugify(base);
  return slug.length >= 3 ? slug : "";
}

function randomSuffix(len = 5): string {
  const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
  let result = "";
  for (let i = 0; i < len; i++) {
    result += chars[Math.floor(Math.random() * chars.length)];
  }
  return result;
}

async function main() {
  if (!existsSync(SONGS_JSON_PATH)) {
    console.error("songs.json not found — run append-songs first");
    process.exit(1);
  }

  const songs: MaiDbSong[] = JSON.parse(readFileSync(SONGS_JSON_PATH, "utf-8"));
  const needsSlugs = songs.filter((s) => !s.slug);

  if (needsSlugs.length === 0) {
    console.log("All songs already have slugs.");
    return;
  }

  console.log(`Generating slugs for ${needsSlugs.length} songs...`);

  // Fetch aliases
  const aliasesTsv = await fetch(ALIASES_URL).then((r) => r.text());
  const aliasMap = new Map<string, string[]>();
  for (const line of aliasesTsv.split("\n")) {
    if (!line.trim()) continue;
    const parts = line.split("\t");
    aliasMap.set(parts[0], parts.slice(1).filter(Boolean));
  }

  // Collect existing slugs to avoid collisions
  const existingSlugs = new Set(songs.filter((s) => s.slug).map((s) => s.slug!));

  for (const song of needsSlugs) {
    const isUtage = song.title.startsWith("[宴]");
    const title = cleanTitle(song.title);
    const aliases = aliasMap.get(song.title) ?? aliasMap.get(title) ?? [];

    let titleSlug = slugify(title);
    const isFullyNonLatin = countAlphaChars(title) === 0;
    const hasShortLatinRuns = longestLatinRun(title) < 6;

    if ((isFullyNonLatin || hasShortLatinRuns) && aliases.length > 0) {
      let bestTitle = aliases[0];
      let bestAlpha = countAlphaChars(aliases[0]);
      for (let i = 1; i < aliases.length; i++) {
        const alpha = countAlphaChars(aliases[i]);
        if (alpha > bestAlpha * 1.5) {
          bestTitle = aliases[i];
          bestAlpha = alpha;
        }
      }
      const aliasSlug = slugify(bestTitle);
      if (isFullyNonLatin || aliasSlug.length > titleSlug.length) {
        titleSlug = aliasSlug;
      }
    }
    if (isUtage) titleSlug += "-utage";

    const artistSlug = slugifyArtist(song.artist);

    // Generate slug with random suffix, retry on collision
    let slug: string;
    do {
      const suffix = randomSuffix();
      slug = [titleSlug, artistSlug, suffix].filter(Boolean).join("-");
    } while (existingSlugs.has(slug));

    song.slug = slug;
    existingSlugs.add(slug);
  }

  writeFileSync(SONGS_JSON_PATH, JSON.stringify(songs, null, 2) + "\n");
  console.log(`Done: generated slugs for ${needsSlugs.length} songs`);
}

main().catch(console.error);

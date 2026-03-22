import { writeFileSync, readFileSync, existsSync } from "fs";
import { SLUGS_BACKFILL_PATH } from "../shared/paths.js";

const ALIASES_URL =
  "https://raw.githubusercontent.com/lomotos10/GCM-bot/refs/heads/main/data/aliases/en/maimai.tsv";

function countAlphaChars(s: string): number {
  return (s.match(/[a-zA-Z]/g) ?? []).length;
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
  // Strip "feat.XXX" suffix before slugifying so it doesn't dominate
  const base = s.replace(/\s*feat\..*$/i, "").trim();
  const slug = slugify(base);
  // If artist is <3 chars after slugify (e.g. all-kanji artist), drop it
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
  const args = process.argv.slice(2);

  if (!existsSync(SLUGS_BACKFILL_PATH)) {
    console.error("slugs-backfill-receipts.json not found — run find-missing-slugs.ts first");
    process.exit(1);
  }

  const entries = JSON.parse(readFileSync(SLUGS_BACKFILL_PATH, "utf-8"));
  const restart = args.includes("--restart");

  if (restart) {
    for (const entry of entries) {
      delete entry.slug;
      delete entry.isUpserted;
    }
    console.log(`Restarting: cleared slugs for ${entries.length} entries`);
  }

  console.log(`Loaded ${entries.length} entries from receipt`);

  // Fetch aliases
  console.log("Fetching aliases...");
  const aliasesTsv = await fetch(ALIASES_URL).then((r) => r.text());
  const aliasMap = new Map<string, string[]>();
  for (const line of aliasesTsv.split("\n")) {
    if (!line.trim()) continue;
    const parts = line.split("\t");
    aliasMap.set(parts[0], parts.slice(1).filter(Boolean));
  }
  console.log(`Loaded aliases for ${aliasMap.size} songs`);

  // Generate slugs
  for (const entry of entries) {
    if (entry.slug) continue; // skip already generated

    const isUtage = entry.title.startsWith("[宴]");
    const title = cleanTitle(entry.title);
    const aliases = aliasMap.get(entry.title) ?? aliasMap.get(title) ?? [];

    let titleSlug = slugify(title);
    const isFullyNonLatin = countAlphaChars(title) === 0;

    if ((isFullyNonLatin || titleSlug.length < 6) && aliases.length > 0) {
      let bestTitle = aliases[0];
      let bestAlpha = countAlphaChars(aliases[0]);
      for (let i = 1; i < aliases.length; i++) {
        const alpha = countAlphaChars(aliases[i]);
        if (alpha > bestAlpha) {
          bestTitle = aliases[i];
          bestAlpha = alpha;
        }
      }
      const aliasSlug = slugify(bestTitle);
      // For fully non-latin titles, use any alias; otherwise only if >=6 chars
      if (isFullyNonLatin || aliasSlug.length >= 6) {
        titleSlug = aliasSlug;
      }
    }
    if (isUtage) titleSlug += "-utage";
    const artistSlug = slugifyArtist(entry.artist);
    const suffix = randomSuffix();
    entry.slug = [titleSlug, artistSlug, suffix].filter(Boolean).join("-");
  }

  // Check for duplicate slugs
  const checkDupe = args.includes("--check-dupe");
  const slugCounts = new Map<string, any[]>();
  for (const entry of entries) {
    if (!entry.slug) continue;
    // Strip the random suffix to compare the base slug
    const base = checkDupe ? entry.slug.replace(/-[a-z0-9]+$/, "") : entry.slug;
    const arr = slugCounts.get(base) ?? [];
    arr.push(entry);
    slugCounts.set(base, arr);
  }

  const dupes = [...slugCounts.entries()].filter(([, v]) => v.length > 1);
  if (dupes.length > 0) {
    console.warn(`\nFound ${dupes.length} duplicate slug bases:`);
    for (const [base, items] of dupes) {
      console.warn(`  "${base}" (${items.length}x):`);
      for (const item of items) {
        console.warn(`    - ${item.title} / ${item.artist} -> ${item.slug}`);
      }
    }
  } else if (checkDupe) {
    console.log("\nNo duplicate slug bases found.");
  }

  writeFileSync(SLUGS_BACKFILL_PATH, JSON.stringify(entries, null, 2) + "\n");
  console.log(`Generated slugs for ${entries.length} entries, receipt updated`);
}

main().catch(console.error);

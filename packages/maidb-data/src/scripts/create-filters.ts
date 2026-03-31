import { readFileSync, writeFileSync, existsSync } from "fs";
import { SONGS_JSON_PATH, FILTERS_JSON_PATH } from "../shared/paths.js";
import {
  CATEGORY_BY_SLUG,
  VERSION_BY_SLUG,
  DIFFICULTY_NAMES,
  DIFFICULTY_COLORS,
  TYPE_NAMES,
  REGION_LABELS,
} from "../constants.js";
import type { MaiDbSong } from "../types/song.js";
import type { SongFiltersData, RangeFilter } from "../types/filters.js";

function buildRange(rawValues: number[]): RangeFilter {
  const sorted = [...new Set(rawValues)].sort((a, b) => a - b);
  return {
    min: sorted[0] ?? 0,
    max: sorted[sorted.length - 1] ?? 0,
    values: sorted,
  };
}

async function main() {
  if (!existsSync(SONGS_JSON_PATH)) {
    console.error("songs.json not found — run append-songs first");
    process.exit(1);
  }

  const songs: MaiDbSong[] = JSON.parse(readFileSync(SONGS_JSON_PATH, "utf-8"));

  const categories = new Set<string>();
  const versions = new Set<string>();
  const difficulties = new Set<string>();
  const types = new Set<string>();
  const levels = new Set<string>();
  const regions = new Set<string>();
  const statuses = new Set<string>();
  const bpms: number[] = [];
  const internalLevelValues: number[] = [];

  for (const song of songs) {
    categories.add(song.category);
    versions.add(song.version);
    if (song.bpm > 0) bpms.push(song.bpm);

    if (song.isNew) statuses.add("new");
    if (song.isLocked) statuses.add("locked");

    for (const sheet of song.sheets) {
      difficulties.add(sheet.difficulty);
      types.add(sheet.type);
      levels.add(sheet.level);

      if (sheet.internalLevelValue > 0) {
        internalLevelValues.push(sheet.internalLevelValue);
      }

      for (const [region, available] of Object.entries(sheet.regions)) {
        if (available) regions.add(region);
      }
    }
  }

  const filters: SongFiltersData = {
    categories: [...categories].map((slug) => ({
      value: slug,
      label: CATEGORY_BY_SLUG[slug]?.category ?? slug,
    })),
    versions: [...versions].map((slug) => ({
      value: slug,
      label: VERSION_BY_SLUG[slug]?.abbr ?? slug,
    })),
    difficulties: [...difficulties].map((d) => ({
      value: d,
      label: DIFFICULTY_NAMES[d] ?? d,
      color: DIFFICULTY_COLORS[d] ?? "#888",
    })),
    types: [...types].map((t) => ({
      value: t,
      label: TYPE_NAMES[t] ?? t,
    })),
    internalLevelRange: buildRange(internalLevelValues),
    levels: [...levels].sort((a, b) => {
      const numA = parseFloat(a);
      const numB = parseFloat(b);
      if (Number.isNaN(numA) && Number.isNaN(numB)) return a.localeCompare(b);
      if (Number.isNaN(numA)) return 1;
      if (Number.isNaN(numB)) return -1;
      return numA - numB;
    }),
    bpmRange: buildRange(bpms),
    regions: [...regions].map((r) => ({
      value: r,
      label: REGION_LABELS[r] ?? r,
    })),
    statuses: [...statuses].map((s) => ({
      value: s,
      label: s === "new" ? "New" : s === "locked" ? "Locked" : s,
    })),
  };

  writeFileSync(FILTERS_JSON_PATH, JSON.stringify(filters, null, 2) + "\n");
  console.log(`Wrote filters.json: ${songs.length} songs analyzed`);
  console.log(`  BPM range: ${filters.bpmRange.min}–${filters.bpmRange.max}`);
  console.log(
    `  Internal level range: ${filters.internalLevelRange.min}–${filters.internalLevelRange.max}`,
  );
  console.log(`  ${filters.levels.length} unique levels`);
  console.log(`  ${filters.categories.length} categories, ${filters.versions.length} versions`);
}

main().catch(console.error);

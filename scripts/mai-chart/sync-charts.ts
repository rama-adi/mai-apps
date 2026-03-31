import { readFileSync, writeFileSync } from "fs";
import { join } from "path";
import { MaiChartMetadataResponse } from "../../packages/maidb-data/src/types/maichart-metadata.js";
import type { MaiDbSong } from "../../packages/maidb-data/src/types/song.js";

const PKG_ROOT = join(import.meta.dirname, "../../packages/maidb-data");
const SONGS_JSON_PATH = join(PKG_ROOT, "data/songs/songs.json");
const CHARTS_JSON_PATH = join(PKG_ROOT, "data/mai-charts/charts.json");
const MANIFEST_URL = "https://mai-notes.com/data/manifest.json";

interface ChartEntry {
  title: string;
  simai_id: string;
  gamerch_id: string;
  charts: {
    id: string;
    difficulty: string;
    level: string;
    internal_level: number;
    version: string;
    release_date: string;
    notes_designer: string | null;
    has_chart_data: boolean;
  }[];
}

function normalizeDifficulty(difficulty: string): string {
  return difficulty.toLowerCase().replace(/re:master/i, "remaster");
}

function normalizeTitle(title: string): string {
  return title
    .trim()
    .toLowerCase()
    .replace(/[^\w\s]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

async function main() {
  console.log("Fetching manifest from mai-notes.com...");
  const res = await fetch(MANIFEST_URL);
  if (!res.ok) throw new Error(`Failed to fetch manifest: ${res.status}`);

  const raw = await res.json();
  const manifest = MaiChartMetadataResponse.parse(raw);

  console.log(`Manifest: ${manifest.songs_count} songs, ${manifest.charts_count} charts`);

  // Load songs.json to get slugs and titles
  const songs: MaiDbSong[] = JSON.parse(readFileSync(SONGS_JSON_PATH, "utf-8"));

  // Build a lookup: normalized title -> { slug, title }
  const songLookup = new Map<string, { slug: string; title: string }>();
  for (const song of songs) {
    songLookup.set(normalizeTitle(song.title), {
      slug: song.slug,
      title: song.title,
    });
  }

  // Build charts grouped by song_id from manifest
  const chartsBySongId = new Map<string, (typeof manifest.charts)[number][]>();
  for (const chart of manifest.charts) {
    const existing = chartsBySongId.get(chart.song_id) ?? [];
    existing.push(chart);
    chartsBySongId.set(chart.song_id, existing);
  }

  // Match manifest songs to songs.json entries
  const results: Record<string, ChartEntry> = {};
  let matched = 0;
  let unmatched = 0;

  for (const [_key, manifestSong] of Object.entries(manifest.songs)) {
    const normalized = normalizeTitle(manifestSong.title);
    const localSong = songLookup.get(normalized);

    if (!localSong) {
      unmatched++;
      continue;
    }

    matched++;
    const songCharts = chartsBySongId.get(manifestSong.id) ?? [];

    const mappedCharts = songCharts.map((c) => ({
      id: c.id,
      difficulty: normalizeDifficulty(c.difficulty),
      level: c.level,
      internal_level: c.internal_level,
      version: c.version,
      release_date: c.release_date,
      notes_designer: c.notes_designer,
      has_chart_data: c.has_chart_data,
    }));

    const existing = results[localSong.slug];
    if (existing) {
      // Merge charts from multiple manifest entries (e.g. standard + DX)
      existing.charts.push(...mappedCharts);
      if (!existing.simai_id && manifestSong.simai_id) existing.simai_id = manifestSong.simai_id;
      if (!existing.gamerch_id && manifestSong.gamerch_id)
        existing.gamerch_id = manifestSong.gamerch_id;
    } else {
      results[localSong.slug] = {
        title: localSong.title,
        simai_id: manifestSong.simai_id ?? "",
        gamerch_id: manifestSong.gamerch_id ?? "",
        charts: mappedCharts,
      };
    }
  }

  // Sort by key for stable output
  const sorted = Object.fromEntries(Object.entries(results).sort(([a], [b]) => a.localeCompare(b)));

  writeFileSync(CHARTS_JSON_PATH, JSON.stringify(sorted, null, 2) + "\n");
  console.log(
    `Wrote ${Object.keys(sorted).length} entries to charts.json (matched: ${matched}, unmatched: ${unmatched})`,
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

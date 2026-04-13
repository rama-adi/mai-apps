import { readFileSync, writeFileSync, mkdirSync, existsSync } from "fs";
import { join } from "path";
import sharp from "sharp";
import { COVER_BASE_URL } from "maidb-data";
import { SONGS_JSON_PATH, ASSETS_DIR, SCRATCH_DIR } from "./shared/paths.js";
import { toDataUrl, generateOgImage } from "./shared/og-image.js";
import type { MaiDbSong } from "maidb-data";

async function main() {
  const args = process.argv.slice(2);
  const songIdIdx = args.indexOf("--song-id");
  if (songIdIdx === -1 || !args[songIdIdx + 1]) {
    console.error("Usage: tsx dryrun-og.ts --song-id <songId>");
    process.exit(1);
  }
  const songId = args[songIdIdx + 1];

  if (!existsSync(SONGS_JSON_PATH)) {
    console.error("songs.json not found — run append-songs first");
    process.exit(1);
  }

  const songs: MaiDbSong[] = JSON.parse(readFileSync(SONGS_JSON_PATH, "utf-8"));
  const song = songs.find((s) => s.songId === songId);

  if (!song) {
    // Show close matches
    const matches = songs
      .filter(
        (s) => s.songId.includes(songId) || s.title.toLowerCase().includes(songId.toLowerCase()),
      )
      .slice(0, 10);
    if (matches.length > 0) {
      console.error(`Song "${songId}" not found. Did you mean:`);
      for (const m of matches) {
        console.error(`  ${m.songId}  —  ${m.title}`);
      }
    } else {
      console.error(`Song "${songId}" not found.`);
    }
    process.exit(1);
  }

  console.log(`Song: ${song.title} (${song.songId})`);
  console.log(`Sheets: ${song.sheets.length}`);
  for (const s of song.sheets) {
    console.log(`  ${s.difficulty} ${s.level} (${s.type})`);
  }

  // Load fonts
  const fonts = [
    {
      name: "M PLUS Rounded 1c",
      data: readFileSync(join(ASSETS_DIR, "M_PLUS_Rounded_1c/MPLUSRounded1c-Regular.ttf"))
        .buffer as ArrayBuffer,
      weight: 400,
      style: "normal",
    },
    {
      name: "M PLUS Rounded 1c",
      data: readFileSync(join(ASSETS_DIR, "M_PLUS_Rounded_1c/MPLUSRounded1c-Bold.ttf"))
        .buffer as ArrayBuffer,
      weight: 700,
      style: "normal",
    },
    {
      name: "M PLUS Rounded 1c",
      data: readFileSync(join(ASSETS_DIR, "M_PLUS_Rounded_1c/MPLUSRounded1c-Black.ttf"))
        .buffer as ArrayBuffer,
      weight: 900,
      style: "normal",
    },
  ];

  const chartBadges: Record<string, string> = {};
  for (const kind of ["std", "dx"]) {
    const buf = readFileSync(join(ASSETS_DIR, `chart-kind/${kind}.png`));
    chartBadges[kind] = toDataUrl(buf, "image/png");
  }

  // Fetch thumbnail
  const fallbackThumb = readFileSync(join(ASSETS_DIR, "nojacket.png"));
  let thumbBuffer: Buffer;
  try {
    console.log(`Fetching cover: ${song.imageName}...`);
    const resp = await fetch(`${COVER_BASE_URL}${song.imageName}`);
    if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
    const raw = Buffer.from(await resp.arrayBuffer());
    if (raw.length < 1024) throw new Error(`Too small (${raw.length} bytes)`);
    thumbBuffer = await sharp(raw).resize(400, 400, { fit: "cover" }).png().toBuffer();
  } catch (e) {
    console.warn(`Cover fetch failed (${e}), using fallback`);
    thumbBuffer = await sharp(fallbackThumb).resize(400, 400, { fit: "cover" }).png().toBuffer();
  }

  const dryrunDir = join(SCRATCH_DIR, "dryrun");
  if (!existsSync(dryrunDir)) mkdirSync(dryrunDir, { recursive: true });

  const thumbPath = join(dryrunDir, "thumb.png");
  writeFileSync(thumbPath, thumbBuffer);

  console.log("Generating OG image...");
  const ogJpeg = await generateOgImage(song, song.sheets, thumbPath, fonts, chartBadges);

  const outPath = join(dryrunDir, `${songId.replace(/[^a-zA-Z0-9._-]/g, "_")}.jpg`);
  writeFileSync(outPath, ogJpeg);
  console.log(`Done: ${outPath}`);
}

main().catch(console.error);

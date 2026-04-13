import { writeFileSync, mkdirSync, readFileSync, existsSync } from "fs";
import { join } from "path";
import sharp from "sharp";
import { nanoid } from "nanoid";
import { COVER_BASE_URL } from "maidb-data";
import { SONGS_JSON_PATH, ASSETS_DIR, THUMB_DIR, OG_DIR, RECEIPTS_PATH } from "./shared/paths.js";
import { toDataUrl, generateOgImage } from "./shared/og-image.js";
import type { MaiDbSong, Receipt } from "maidb-data";

async function main() {
  const args = process.argv.slice(2);
  const limitIdx = args.indexOf("--limit");
  const limit = limitIdx !== -1 ? parseInt(args[limitIdx + 1]) : undefined;
  const concurrencyIdx = args.indexOf("--concurrency");
  const concurrency = concurrencyIdx !== -1 ? parseInt(args[concurrencyIdx + 1]) : 5;

  if (!existsSync(SONGS_JSON_PATH)) {
    console.error("songs.json not found — run append-songs first");
    process.exit(1);
  }

  const allSongs: MaiDbSong[] = JSON.parse(readFileSync(SONGS_JSON_PATH, "utf-8"));

  // Only process songs without an internalImageId
  let entries = allSongs.filter((s) => !s.internalImageId);

  // If receipts already exist, skip songs that already have a receipt
  let existingReceipts: Receipt[] = [];
  if (existsSync(RECEIPTS_PATH)) {
    existingReceipts = JSON.parse(readFileSync(RECEIPTS_PATH, "utf-8"));
    const receiptedSongs = new Set(existingReceipts.map((r) => r.songId));
    entries = entries.filter((s) => !receiptedSongs.has(s.songId));
  }

  if (entries.length === 0) {
    console.log("No new songs need image assets.");
    return;
  }

  if (limit) {
    entries = entries.sort(() => Math.random() - 0.5).slice(0, limit);
  }

  // Clean up and recreate scratch dirs
  for (const dir of [THUMB_DIR, OG_DIR]) {
    if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
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

  // Load chart type badges as data URLs
  const chartBadges: Record<string, string> = {};
  for (const kind of ["std", "dx"]) {
    const buf = readFileSync(join(ASSETS_DIR, `chart-kind/${kind}.png`));
    chartBadges[kind] = toDataUrl(buf, "image/png");
  }

  const fallbackThumb = readFileSync(join(ASSETS_DIR, "nojacket.png"));
  const fallbackPng = await sharp(fallbackThumb)
    .resize(400, 400, { fit: "cover" })
    .png()
    .toBuffer();

  // --- Phase 1: Fetch all thumbnails ---
  console.log(`Phase 1: Fetching ${entries.length} thumbnails (concurrency: ${concurrency})...`);

  interface FetchedEntry {
    song: MaiDbSong;
    id: string;
    thumbBuffer: Buffer;
    jacketFound: boolean;
  }

  const fetched: FetchedEntry[] = [];
  let fetchDone = 0;

  async function fetchThumb(song: MaiDbSong): Promise<FetchedEntry> {
    const id = `img_${nanoid(12)}`;
    const idx = ++fetchDone;

    let jacketFound = true;
    let thumbBuffer: Buffer;
    try {
      const thumbResp = await fetch(`${COVER_BASE_URL}${song.imageName}`);
      if (!thumbResp.ok) throw new Error(`HTTP ${thumbResp.status}`);
      const raw = Buffer.from(await thumbResp.arrayBuffer());
      if (raw.length < 1024) throw new Error(`Response too small (${raw.length} bytes)`);
      thumbBuffer = await sharp(raw).resize(400, 400, { fit: "cover" }).png().toBuffer();
    } catch (e) {
      console.warn(`  [${idx}/${entries.length}] ${song.title} -> fallback (${String(e)})`);
      thumbBuffer = fallbackPng;
      jacketFound = false;
    }

    if (idx % 50 === 0 || idx === entries.length) {
      console.log(`  fetched ${idx}/${entries.length}`);
    }

    return { song, id, thumbBuffer, jacketFound };
  }

  for (let i = 0; i < entries.length; i += concurrency) {
    const batch = entries.slice(i, i + concurrency);
    const results = await Promise.allSettled(batch.map(fetchThumb));
    for (const r of results) {
      if (r.status === "fulfilled") fetched.push(r.value);
      else console.error(`  fetch failed: ${r.reason}`);
    }
  }

  console.log(`Fetched ${fetched.length}/${entries.length} thumbnails.`);

  // --- Phase 2: Generate OG images ---
  console.log(`Phase 2: Generating ${fetched.length} OG images...`);

  const newReceipts: Receipt[] = [];
  let genDone = 0;

  async function generateForEntry(item: FetchedEntry) {
    const { song, id, thumbBuffer, jacketFound } = item;
    const idx = ++genDone;

    const thumbPath = join(THUMB_DIR, `${id}.png`);
    writeFileSync(thumbPath, thumbBuffer);

    const ogJpeg = await generateOgImage(song, song.sheets, thumbPath, fonts, chartBadges);
    const ogPath = join(OG_DIR, `${id}.jpg`);
    writeFileSync(ogPath, ogJpeg);

    newReceipts.push({
      songId: song.songId,
      imageName: song.imageName,
      internalId: id,
      isUploaded: false,
      jacketFound,
    });

    if (idx % 50 === 0 || idx === fetched.length) {
      console.log(`  generated ${idx}/${fetched.length}`);
    }
  }

  const genConcurrency = Math.max(2, Math.ceil(concurrency / 2));
  for (let i = 0; i < fetched.length; i += genConcurrency) {
    const batch = fetched.slice(i, i + genConcurrency);
    const results = await Promise.allSettled(batch.map(generateForEntry));
    for (const r of results) {
      if (r.status === "rejected") console.error(`  generate failed: ${r.reason}`);
    }
  }

  // Merge with existing receipts and write
  const allReceipts = [...existingReceipts, ...newReceipts];
  writeFileSync(RECEIPTS_PATH, JSON.stringify(allReceipts, null, 2) + "\n");
  console.log(
    `Done! ${newReceipts.length} new receipts (${allReceipts.length} total) -> ${RECEIPTS_PATH}`,
  );
}

main().catch(console.error);

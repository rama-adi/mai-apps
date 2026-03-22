import { writeFileSync, mkdirSync, readFileSync, existsSync } from "fs";
import { join } from "path";
import sharp from "sharp";
import { nanoid } from "nanoid";
import {
  ASSETS_DIR,
  THUMB_DIR,
  OG_DIR,
  BACKFILL_INPUT_PATH,
  BACKFILL_RECEIPTS_PATH,
} from "../shared/paths.js";
import { toDataUrl, generateOgImage } from "../shared/og-image.js";

const COVER_BASE_URL = "https://dp4p6x0xfi5o9.cloudfront.net/maimai/img/cover/";

async function main() {
  const args = process.argv.slice(2);
  const limitIdx = args.indexOf("--limit");
  const limit = limitIdx !== -1 ? parseInt(args[limitIdx + 1]) : undefined;
  const concurrencyIdx = args.indexOf("--concurrency");
  const concurrency = concurrencyIdx !== -1 ? parseInt(args[concurrencyIdx + 1]) : 5;

  if (!existsSync(BACKFILL_INPUT_PATH)) {
    console.error("backfill-receipts.json not found — run find-missing-images.ts first");
    process.exit(1);
  }

  mkdirSync(THUMB_DIR, { recursive: true });
  mkdirSync(OG_DIR, { recursive: true });

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

  let entries: any[] = JSON.parse(readFileSync(BACKFILL_INPUT_PATH, "utf-8"));
  console.log(`Backfill mode: ${entries.length} entries from backfill-receipts.json`);

  if (limit) {
    entries = entries.sort(() => Math.random() - 0.5).slice(0, limit);
  }

  const fallbackThumb = readFileSync(join(ASSETS_DIR, "nojacket.png"));
  const fallbackPng = await sharp(fallbackThumb)
    .resize(400, 400, { fit: "cover" })
    .png()
    .toBuffer();

  // --- Phase 1: Fetch all thumbnails in parallel ---
  console.log(`Phase 1: Fetching ${entries.length} thumbnails (concurrency: ${concurrency})...`);

  interface FetchedEntry {
    entry: any;
    id: string;
    thumbBuffer: Buffer;
    jacketFound: boolean;
  }

  const fetched: FetchedEntry[] = [];
  let fetchDone = 0;

  async function fetchThumb(entry: any): Promise<FetchedEntry> {
    const { song } = entry;
    const id = `img_${nanoid(12)}`;
    const idx = ++fetchDone;

    let jacketFound = true;
    let thumbBuffer: Buffer;
    try {
      const thumbResp = await fetch(`${COVER_BASE_URL}${song.imageName}`);
      if (!thumbResp.ok) {
        throw new Error(`HTTP ${thumbResp.status}`);
      }
      const raw = Buffer.from(await thumbResp.arrayBuffer());
      if (raw.length < 1024) {
        throw new Error(`Response too small (${raw.length} bytes)`);
      }
      thumbBuffer = await sharp(raw).resize(400, 400, { fit: "cover" }).png().toBuffer();
    } catch (e) {
      console.warn(`  [${idx}/${entries.length}] ${song.title} -> fallback (${String(e)})`);
      thumbBuffer = fallbackPng;
      jacketFound = false;
    }

    if (idx % 50 === 0 || idx === entries.length) {
      console.log(`  fetched ${idx}/${entries.length}`);
    }

    return { entry, id, thumbBuffer, jacketFound };
  }

  // Fetch with concurrency pool
  for (let i = 0; i < entries.length; i += concurrency) {
    const batch = entries.slice(i, i + concurrency);
    const results = await Promise.allSettled(batch.map(fetchThumb));
    for (const r of results) {
      if (r.status === "fulfilled") {
        fetched.push(r.value);
      } else {
        console.error(`  fetch failed: ${r.reason}`);
      }
    }
  }

  console.log(`Fetched ${fetched.length}/${entries.length} thumbnails.`);

  // --- Phase 2: Generate OG images (CPU-bound, sequential per core but parallel via batches) ---
  console.log(`Phase 2: Generating ${fetched.length} OG images...`);

  const receipts: {
    imageName: string;
    internalId: string;
    isUploaded: boolean;
    jacketFound: boolean;
  }[] = [];
  let genDone = 0;

  async function generateForEntry(item: FetchedEntry) {
    const { entry, id, thumbBuffer, jacketFound } = item;
    const { song, sheets } = entry.song ? entry : { song: entry.song, sheets: entry.sheets };
    const idx = ++genDone;

    // Write thumb to disk
    const thumbPath = join(THUMB_DIR, `${id}.png`);
    writeFileSync(thumbPath, thumbBuffer);

    // Generate OG image
    const ogJpeg = await generateOgImage(song, sheets, thumbPath, fonts, chartBadges);
    const ogPath = join(OG_DIR, `${id}.jpg`);
    writeFileSync(ogPath, ogJpeg);

    receipts.push({ imageName: song.imageName, internalId: id, isUploaded: false, jacketFound });

    if (idx % 50 === 0 || idx === fetched.length) {
      console.log(`  generated ${idx}/${fetched.length}`);
    }
  }

  // OG generation is CPU-heavy (satori + resvg + sharp), use smaller batches
  const genConcurrency = Math.max(2, Math.ceil(concurrency / 2));
  for (let i = 0; i < fetched.length; i += genConcurrency) {
    const batch = fetched.slice(i, i + genConcurrency);
    const results = await Promise.allSettled(batch.map(generateForEntry));
    for (const r of results) {
      if (r.status === "rejected") {
        console.error(`  generate failed: ${r.reason}`);
      }
    }
  }

  // Write receipts
  writeFileSync(BACKFILL_RECEIPTS_PATH, JSON.stringify(receipts, null, 2) + "\n");
  console.log(`\nDone! ${receipts.length} receipts written to ${BACKFILL_RECEIPTS_PATH}`);
}

main().catch(console.error);

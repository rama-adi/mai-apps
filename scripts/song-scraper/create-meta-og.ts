import { readFileSync, writeFileSync, mkdirSync, existsSync } from "fs";
import { join } from "path";
import sharp from "sharp";
import { ASSETS_DIR } from "./shared/paths.js";
import { generateMetaOgImage } from "./shared/meta-og-image.js";

const LOGO_PATH = join(import.meta.dirname, "shared/logo.png");

const OUTPUT_DIR = join(import.meta.dirname, "../../apps/maidb-web/public/og-img");

const META_COLOR = "#dc1d5e";

interface MetaPage {
  slug: string;
  label: string;
  title: string;
}

const META_PAGES: MetaPage[] = [
  { slug: "home", label: "Welcome to", title: "maiSong-db" },
  { slug: "songs", label: "Browse", title: "All Songs" },
  { slug: "about", label: "About", title: "maiSong-db" },
];

async function main() {
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

  if (!existsSync(OUTPUT_DIR)) mkdirSync(OUTPUT_DIR, { recursive: true });

  const logoPng = await sharp(readFileSync(LOGO_PATH))
    .resize(80, 80, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toBuffer();
  const logoDataUrl = `data:image/png;base64,${logoPng.toString("base64")}`;

  for (const p of META_PAGES) {
    console.log(`Generating OG: meta-${p.slug} (${p.label} / ${p.title})`);
    const jpeg = await generateMetaOgImage(p.label, p.title, META_COLOR, fonts, logoDataUrl);

    const outPath = join(OUTPUT_DIR, `meta-${p.slug}.jpg`);
    writeFileSync(outPath, jpeg);
    console.log(`  -> ${outPath}`);
  }

  console.log(`\nDone. ${META_PAGES.length} meta OG images written to ${OUTPUT_DIR}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

import { readFileSync, writeFileSync, mkdirSync, existsSync } from "fs";
import { join } from "path";
import sharp from "sharp";
import { ASSETS_DIR, METADATA_JSON_PATH } from "./shared/paths.js";
import { generateCategoryOgImage } from "./shared/category-og-image.js";

const LOGO_PATH = join(import.meta.dirname, "shared/logo.png");

const OUTPUT_DIR = join(import.meta.dirname, "../../apps/maidb-web/public/og-img");

interface MetadataCategory {
  category: string;
  color: string;
  slug: string;
}

interface Metadata {
  categories: MetadataCategory[];
}

async function main() {
  const metadata: Metadata = JSON.parse(readFileSync(METADATA_JSON_PATH, "utf-8"));

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

  for (const cat of metadata.categories) {
    console.log(`Generating OG: ${cat.slug} (${cat.category})`);
    const jpeg = await generateCategoryOgImage(cat.category, cat.color, fonts, logoDataUrl);

    const outPath = join(OUTPUT_DIR, `category-${cat.slug}.jpg`);
    writeFileSync(outPath, jpeg);
    console.log(`  -> ${outPath}`);
  }

  console.log(`\nDone. ${metadata.categories.length} category OG images written to ${OUTPUT_DIR}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

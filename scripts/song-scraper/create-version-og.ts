import { readFileSync, writeFileSync, mkdirSync, existsSync } from "fs";
import { join } from "path";
import sharp from "sharp";
import { ASSETS_DIR, METADATA_JSON_PATH } from "./shared/paths.js";
import { generateVersionOgImage } from "./shared/version-og-image.js";

const LOGO_PATH = join(import.meta.dirname, "shared/logo.png");

const OUTPUT_DIR = join(import.meta.dirname, "../../apps/maidb-web/public/og-img");

// Red sampled from the logo's pink-red ring.
const VERSION_COLOR = "#dc1d5e";

interface MetadataVersion {
  version: string;
  abbr: string;
  releaseDate: string;
  slug: string;
}

interface Metadata {
  versions: MetadataVersion[];
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

  for (const v of metadata.versions) {
    console.log(`Generating OG: ${v.slug} (${v.version})`);
    const jpeg = await generateVersionOgImage(v.version, VERSION_COLOR, fonts, logoDataUrl);

    const outPath = join(OUTPUT_DIR, `version-${v.slug}.jpg`);
    writeFileSync(outPath, jpeg);
    console.log(`  -> ${outPath}`);
  }

  console.log(`\nDone. ${metadata.versions.length} version OG images written to ${OUTPUT_DIR}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

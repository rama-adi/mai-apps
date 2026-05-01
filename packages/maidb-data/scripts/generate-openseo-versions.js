import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const metadataPath = path.resolve(__dirname, "../data/songs/metadata.json");
const versionsDir = path.resolve(__dirname, "../data/versions");
const outputPath = path.resolve(__dirname, "../data/openseo/versions.json");

const metadata = JSON.parse(fs.readFileSync(metadataPath, "utf-8"));

const result = metadata.versions.map((v) => {
  const mdPath = path.join(versionsDir, `${v.slug}.md`);
  const content = fs.readFileSync(mdPath, "utf-8").trim();
  return {
    version: v.version,
    slug: v.slug,
    content,
  };
});

fs.mkdirSync(path.dirname(outputPath), { recursive: true });
fs.writeFileSync(outputPath, JSON.stringify(result, null, 2));
console.log(`Wrote ${result.length} versions to ${outputPath}`);

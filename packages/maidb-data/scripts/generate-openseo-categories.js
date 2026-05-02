import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const metadataPath = path.resolve(__dirname, "../data/songs/metadata.json");
const categoriesDir = path.resolve(__dirname, "../data/categories");
const outputPath = path.resolve(__dirname, "../data/openseo/categories.json");

const metadata = JSON.parse(fs.readFileSync(metadataPath, "utf-8"));

const result = metadata.categories.map((c) => {
  const mdPath = path.join(categoriesDir, `${c.slug}.md`);
  const content = fs.readFileSync(mdPath, "utf-8").trim();
  return {
    category: c.category,
    slug: c.slug,
    content,
  };
});

fs.mkdirSync(path.dirname(outputPath), { recursive: true });
fs.writeFileSync(outputPath, JSON.stringify(result, null, 2));
console.log(`Wrote ${result.length} categories to ${outputPath}`);

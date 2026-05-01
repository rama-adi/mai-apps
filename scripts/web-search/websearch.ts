import { Exa } from "exa-js";
import "dotenv/config";

const exa = new Exa(process.env.EXA_API_KEY);

async function main() {
  const query = process.argv[2];
  if (!query) {
    console.error("Usage: tsx websearch.ts <query>");
    process.exit(1);
  }

  const result = await exa.search(query, {
    numResults: 10,
    type: "auto",
    contents: {
      highlights: true,
    },
  });

  for (const [index, item] of result.results.entries()) {
    console.log(`- source ${index + 1}: ${item.url}`);
    let summary = item.highlights?.join(" ") || item.title || "No summary";
    summary = summary.trim().replace(/\n{3,}/g, "\n\n");
    console.log(`- summary: ${summary}`);
    console.log();
  }
}

main().catch(console.error);

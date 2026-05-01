import { Exa } from "exa-js";
import "dotenv/config";

const exa = new Exa(process.env.EXA_API_KEY);

async function main() {
  const url = process.argv[2];
  if (!url) {
    console.error("Usage: tsx webfetch.ts <url>");
    process.exit(1);
  }

  const result = await exa.getContents([url], {
    text: {
      verbosity: "full",
    },
  });

  for (const [index, item] of result.results.entries()) {
    console.log(`- source ${index + 1}: ${item.url}`);
    console.log(`- title: ${item.title || "No title"}`);
    console.log(`- author: ${item.author || "No author"}`);
    const text = (item.text || "No text").trim().replace(/\n{3,}/g, "\n\n");
    console.log(`- text: ${text}`);
    console.log();
  }
}

main().catch(console.error);

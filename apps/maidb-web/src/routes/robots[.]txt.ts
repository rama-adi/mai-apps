import { createFileRoute } from "@tanstack/react-router";
import { SITE_URL } from "../lib/site";

const BODY = [
  "User-agent: *",
  "Allow: /",
  "Disallow: /songs/modal/",
  "Disallow: /modal/",
  "Disallow: /version/*/modal/",
  "",
  `Sitemap: ${SITE_URL}/sitemap.xml`,
  "",
].join("\n");

export const Route = createFileRoute("/robots.txt")({
  server: {
    handlers: {
      GET: async () =>
        new Response(BODY, {
          headers: {
            "Content-Type": "text/plain; charset=utf-8",
            "Cache-Control": "public, max-age=3600, s-maxage=86400",
          },
        }),
    },
  },
});

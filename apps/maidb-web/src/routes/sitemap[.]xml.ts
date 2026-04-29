import { createFileRoute } from "@tanstack/react-router";
import { SITE_URL } from "../lib/site";
import { buildSitemapIndex, todayIso, xmlResponse } from "../lib/sitemap";

export const Route = createFileRoute("/sitemap.xml")({
  server: {
    handlers: {
      GET: async () => {
        const lastmod = todayIso();
        const body = buildSitemapIndex([
          { loc: `${SITE_URL}/sitemaps/songs.xml`, lastmod },
          { loc: `${SITE_URL}/sitemaps/versions.xml`, lastmod },
        ]);
        return xmlResponse(body);
      },
    },
  },
});

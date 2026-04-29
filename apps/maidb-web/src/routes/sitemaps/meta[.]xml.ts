import { createFileRoute } from "@tanstack/react-router";
import { SITE_URL } from "../../lib/site";
import { buildUrlset, todayIso, type UrlEntry, xmlResponse } from "../../lib/sitemap";

export const Route = createFileRoute("/sitemaps/meta.xml")({
  server: {
    handlers: {
      GET: async () => {
        const today = todayIso();

        const entries: UrlEntry[] = [
          { loc: `${SITE_URL}/`, lastmod: today, changefreq: "daily", priority: "1.0" },
          { loc: `${SITE_URL}/songs`, lastmod: today, changefreq: "daily", priority: "0.9" },
          { loc: `${SITE_URL}/about`, lastmod: today, changefreq: "monthly", priority: "0.3" },
        ];

        return xmlResponse(buildUrlset(entries));
      },
    },
  },
});

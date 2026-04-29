import { createFileRoute } from "@tanstack/react-router";
import { getMetadata } from "../../lib/song-data.server";
import { SITE_URL } from "../../lib/site";
import { buildUrlset, todayIso, type UrlEntry, xmlResponse } from "../../lib/sitemap";

export const Route = createFileRoute("/sitemaps/versions.xml")({
  server: {
    handlers: {
      GET: async () => {
        const metadata = await getMetadata();
        const today = todayIso();

        const entries: UrlEntry[] = metadata.versions.map((version) => ({
          loc: `${SITE_URL}/version/${version.slug}`,
          lastmod: version.releaseDate || today,
          changefreq: "weekly",
          priority: "0.6",
        }));

        return xmlResponse(buildUrlset(entries));
      },
    },
  },
});

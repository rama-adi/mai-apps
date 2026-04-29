import { createFileRoute } from "@tanstack/react-router";
import { loadSongList } from "../../lib/song-data.server";
import { SITE_URL } from "../../lib/site";
import { buildUrlset, type UrlEntry, xmlResponse } from "../../lib/sitemap";

export const Route = createFileRoute("/sitemaps/songs.xml")({
  server: {
    handlers: {
      GET: async () => {
        const { songs } = await loadSongList();

        const entries: UrlEntry[] = songs.map((song) => ({
          loc: `${SITE_URL}/songs/${song.slug}`,
          lastmod: song.releaseDate || undefined,
          changefreq: "monthly",
          priority: "0.7",
        }));

        return xmlResponse(buildUrlset(entries));
      },
    },
  },
});

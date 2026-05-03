import { createFileRoute } from "@tanstack/react-router";
import { loadSongList } from "../../lib/song-data.server";
import { SITE_URL } from "../../lib/site";
import { buildUrlset, xmlResponse } from "../../lib/sitemap";

const GET = async () => {
  const { songs } = await loadSongList();
  const locs = songs.map((song) => `${SITE_URL}/songs/${song.slug}`);
  return xmlResponse(buildUrlset(locs));
};

export const Route = createFileRoute("/sitemaps/songs.xml")({
  server: {
    handlers: {
      GET,
      HEAD: GET,
    },
  },
});

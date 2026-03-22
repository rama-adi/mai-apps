import { createFileRoute } from "@tanstack/react-router";
import { loadSongListResponse } from "../lib/song-data.server";

export const Route = createFileRoute("/songlist")({
  server: {
    handlers: {
      GET: () => loadSongListResponse(),
    },
  },
});

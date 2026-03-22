import { createServerFn } from "@tanstack/react-start";
import { setResponseHeaders } from "@tanstack/react-start/server";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@packages/backend/convex/_generated/api";

const convex = new ConvexHttpClient(process.env.VITE_CONVEX_URL!);

export const getLatestSongs = createServerFn().handler(async () => {
  const songs = await convex.query(api.songs.latestSongs);

  setResponseHeaders({
    "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300",
  });

  return songs;
});

export const getFilterOptions = createServerFn().handler(async () => {
  const options = await convex.query(api.songs.filterOptions);

  setResponseHeaders({
    "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600",
  });

  return options;
});

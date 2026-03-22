import { createServerFn } from "@tanstack/react-start";
import { setResponseHeaders } from "@tanstack/react-start/server";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@packages/backend/convex/_generated/api";

const convex = new ConvexHttpClient(process.env.VITE_CONVEX_URL!);

export const getSongBySlug = (slug: string) =>
  createServerFn({ method: "GET" }).handler(async () => {
    const song = await convex.query(api.songs.getSongBySlug, { slug });

    if (song) {
      setResponseHeaders({
        "Cache-Control": "public, s-maxage=120, stale-while-revalidate=600",
      });
    }

    return song;
  })();

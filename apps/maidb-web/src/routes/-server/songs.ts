import { createServerFn } from "@tanstack/react-start";
import {
  getSongBySlug as getSongBySlugServer,
  getMaiNotesCharts as getMaiNotesChartsServer,
  getCounterpartSong as getCounterpartSongServer,
} from "../../lib/song-data.server";

export const getSongBySlug = createServerFn({ method: "GET" })
  .inputValidator((data: { slug: string }) => data)
  .handler((async ({ data }: { data: { slug: string } }) => {
    return getSongBySlugServer(data.slug);
  }) as never);

export const getMaiNotesCharts = createServerFn({ method: "GET" })
  .inputValidator((data: { slug: string }) => data)
  .handler((async ({ data }: { data: { slug: string } }) => {
    return getMaiNotesChartsServer(data.slug);
  }) as never);

export const getCounterpartSong = createServerFn({ method: "GET" })
  .inputValidator((data: { songId: string }) => data)
  .handler((async ({ data }: { data: { songId: string } }) => {
    return getCounterpartSongServer(data.songId);
  }) as never);

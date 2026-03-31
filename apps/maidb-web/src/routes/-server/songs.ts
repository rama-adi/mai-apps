import { createServerFn } from "@tanstack/react-start";
import {
  getSongBySlug as getSongBySlugServer,
  getMaiNotesCharts as getMaiNotesChartsServer,
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

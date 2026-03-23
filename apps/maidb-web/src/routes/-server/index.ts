import { createServerFn } from "@tanstack/react-start";
import {
  getFilterOptions as getFilterOptionsServer,
  getLatestSongs as getLatestSongsServer,
} from "../../lib/song-data.server";
import type { FilterOptions } from "maidb-data";

export const getLatestSongs = createServerFn({ method: "GET" })
  .inputValidator((data: { limit?: number } | undefined) => data)
  .handler((async ({ data }: { data: { limit?: number } | undefined }) => {
    return getLatestSongsServer(data?.limit);
  }) as never);

export const getFilterOptions = createServerFn({ method: "GET" }).handler(
  (async (): Promise<FilterOptions> => {
    return getFilterOptionsServer();
  }) as never,
);

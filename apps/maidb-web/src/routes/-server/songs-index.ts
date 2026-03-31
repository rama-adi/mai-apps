import { createServerFn } from "@tanstack/react-start";
import {
  getFilterOptions as getFilterOptionsServer,
  getLatestSongs as getLatestSongsServer,
  getSongFiltersData as getSongFiltersDataServer,
} from "../../lib/song-data.server";
import type { FilterOptions, SongFiltersData } from "maidb-data";

export const getSongsPageLatest = createServerFn({ method: "GET" }).handler((async () => {
  return getLatestSongsServer();
}) as never);

export const getSongsPageFilterOptions = createServerFn({ method: "GET" }).handler(
  (async (): Promise<FilterOptions> => {
    return getFilterOptionsServer();
  }) as never,
);

export const getSongsPageFiltersData = createServerFn({ method: "GET" }).handler(
  (async (): Promise<SongFiltersData> => {
    return getSongFiltersDataServer();
  }) as never,
);

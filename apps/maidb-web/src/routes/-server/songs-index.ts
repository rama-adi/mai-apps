import { createServerFn } from "@tanstack/react-start";
import {
  getFilterOptions as getFilterOptionsServer,
  loadSongList as loadSongListServer,
  getSongFiltersData as getSongFiltersDataServer,
} from "../../lib/song-data.server";
import type { FilterOptions, SongFiltersData } from "maidb-data";

export const getSongsPageSongs = createServerFn({ method: "GET" }).handler((async () => {
  const { songs } = await loadSongListServer();
  return songs;
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

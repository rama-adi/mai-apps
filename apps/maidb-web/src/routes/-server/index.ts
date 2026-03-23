import { createServerFn } from "@tanstack/react-start";
import {
  getFilterOptions as getFilterOptionsServer,
  getLatestSongs as getLatestSongsServer,
  getMetadata as getMetadataServer,
} from "../../lib/song-data.server";
import type { FilterOptions } from "maidb-data";

export const getLatestSongs = createServerFn({ method: "GET" }).handler((() => {
  return getLatestSongsServer();
}) as never);

export const getFilterOptions = createServerFn({ method: "GET" }).handler(
  (async (): Promise<FilterOptions> => {
    return getFilterOptionsServer();
  }) as never,
);

export const getMetadata = createServerFn({ method: "GET" }).handler((() => {
  return getMetadataServer();
}) as never);

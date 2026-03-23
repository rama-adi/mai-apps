import { createServerFn } from "@tanstack/react-start";
import {
  getLatestSongs as getLatestSongsServer,
  getMetadata as getMetadataServer,
} from "../../lib/song-data.server";

export const getLatestSongs = createServerFn({ method: "GET" }).handler((() => {
  return getLatestSongsServer();
}) as never);

export const getMetadata = createServerFn({ method: "GET" }).handler((() => {
  return getMetadataServer();
}) as never);

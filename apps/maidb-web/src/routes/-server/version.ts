import { createServerFn } from "@tanstack/react-start";
import {
  getMetadata as getMetadataServer,
  getSongsByVersion as getSongsByVersionServer,
} from "../../lib/song-data.server";

export const getVersionPageData = createServerFn({ method: "GET" })
  .inputValidator((data: { slug: string }) => data)
  .handler((async ({ data }: { data: { slug: string } }) => {
    const [songs, metadata] = await Promise.all([
      getSongsByVersionServer(data.slug),
      Promise.resolve(getMetadataServer()),
    ]);
    const version = metadata.versions.find((item) => item.slug === data.slug) ?? null;
    return { songs, version };
  }) as never);

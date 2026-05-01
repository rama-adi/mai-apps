import { createServerFn } from "@tanstack/react-start";
import {
  getMetadata as getMetadataServer,
  getSongsByVersion as getSongsByVersionServer,
} from "../../lib/song-data.server";
import { getOpenSeoVersionBySlug as getOpenSeoVersionBySlugServer } from "../../lib/openseo-data.server";

export const getVersionPageData = createServerFn({ method: "GET" })
  .inputValidator((data: { slug: string }) => data)
  .handler((async ({ data }: { data: { slug: string } }) => {
    const [songs, metadata, openSeo] = await Promise.all([
      getSongsByVersionServer(data.slug),
      getMetadataServer(),
      getOpenSeoVersionBySlugServer(data.slug),
    ]);
    const version = metadata.versions.find((item) => item.slug === data.slug) ?? null;
    return { songs, version, openSeo };
  }) as never);

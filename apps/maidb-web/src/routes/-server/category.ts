import { createServerFn } from "@tanstack/react-start";
import {
  getMetadata as getMetadataServer,
  getSongsByCategory as getSongsByCategoryServer,
} from "../../lib/song-data.server";
import { getOpenSeoCategoryBySlug as getOpenSeoCategoryBySlugServer } from "../../lib/openseo-data.server";

export const getCategoryPageData = createServerFn({ method: "GET" })
  .inputValidator((data: { slug: string }) => data)
  .handler((async ({ data }: { data: { slug: string } }) => {
    const [songs, metadata, openSeo] = await Promise.all([
      getSongsByCategoryServer(data.slug),
      getMetadataServer(),
      getOpenSeoCategoryBySlugServer(data.slug),
    ]);
    const category = metadata.categories.find((item) => item.slug === data.slug) ?? null;
    return { songs, category, openSeo };
  }) as never);

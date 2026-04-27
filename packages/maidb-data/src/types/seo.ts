import { z } from "zod";

export const StructuredOutputData = z.object({
  seoTitle: z.string(),
  metaDescription: z.string(),
  tags: z.array(z.string()),
  overview: z.string(),
  trivia: z.array(z.string()),
  youtubeVideos: z.array(
    z.object({
      url: z.string(),
      type: z.enum([
        "official-video",
        "chart-basic",
        "chart-advanced",
        "chart-expert",
        "chart-master",
        "chart-remaster",
      ]),
    }),
  ),
  faq: z.array(
    z.object({
      q: z.string(),
      a: z.string(),
    }),
  ),
});

export const SongSeoEntry = z.object({
  songId: z.string(),
  slug: z.string(),
  schema: StructuredOutputData,
});

export const SongSeoData = z.array(SongSeoEntry);

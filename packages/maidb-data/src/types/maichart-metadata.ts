import { z } from "zod";

export const MaiChartMetadataResponse = z.object({
  generated_at: z.string(),
  songs_count: z.number(),
  charts_count: z.number(),
  songs: z.record(
    z.string(),
    z.object({
      id: z.string(),
      title: z.string(),
      artist: z.string(),
      bpm: z.string(),
      genre: z.string(),
      version: z.string(),
      type: z.string(),
      release_date: z.string(),
      gamerch_id: z.string().nullable(),
      simai_id: z.string().nullable(),
      gamerch_scraped_at: z.string().nullable(),
      simai_scraped_at: z.string().nullable(),
    }),
  ),
  charts: z.array(
    z.union([
      z.object({
        id: z.string(),
        song_id: z.string(),
        difficulty: z.string(),
        level: z.string(),
        internal_level: z.number(),
        version: z.string(),
        release_date: z.string(),
        notes_designer: z.null(),
        has_chart_data: z.boolean(),
      }),
      z.object({
        id: z.string(),
        song_id: z.string(),
        difficulty: z.string(),
        level: z.string(),
        internal_level: z.number(),
        version: z.string(),
        release_date: z.string(),
        notes_designer: z.string(),
        has_chart_data: z.boolean(),
      }),
    ]),
  ),
});

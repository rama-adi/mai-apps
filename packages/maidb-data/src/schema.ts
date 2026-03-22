import { z } from "zod";

// -- Receipt schema (image upload tracking) -----------------------------------

export const receiptSchema = z.object({
  imageName: z.string(),
  internalId: z.string(),
  isUploaded: z.boolean(),
  jacketFound: z.boolean(),
});

export type Receipt = z.infer<typeof receiptSchema>;

// -- songs.json entry schema --------------------------------------------------

export const sheetSchema = z.object({
  type: z.string(),
  difficulty: z.string(),
  level: z.string(),
  levelValue: z.number(),
  internalLevel: z.union([z.string(), z.null()]),
  internalLevelValue: z.number(),
  noteDesigner: z.string(),
  noteCounts: z.object({
    tap: z.union([z.number(), z.null()]),
    hold: z.union([z.number(), z.null()]),
    slide: z.union([z.number(), z.null()]),
    touch: z.union([z.number(), z.null()]),
    break: z.union([z.number(), z.null()]),
    total: z.number(),
  }),
  regions: z.object({
    jp: z.boolean(),
    intl: z.boolean(),
    usa: z.boolean(),
    cn: z.boolean(),
  }),
  regionOverrides: z.object({ intl: z.object({}).passthrough() }),
  isSpecial: z.boolean(),
  version: z.string().optional(),
});

export const maiDbSongSchema = z.object({
  songId: z.string(),
  category: z.string(),
  title: z.string(),
  artist: z.string(),
  bpm: z.number(),
  imageName: z.string(),
  version: z.string(),
  releaseDate: z.string(),
  isNew: z.boolean(),
  isLocked: z.boolean(),
  comment: z.union([z.string(), z.null()]),
  slug: z.string(),
  internalImageId: z.string(),
  sheets: z.array(sheetSchema),
  keyword: z.string(),
});

export type MaiDbSong = z.infer<typeof maiDbSongSchema>;
export type Sheet = z.infer<typeof sheetSchema>;

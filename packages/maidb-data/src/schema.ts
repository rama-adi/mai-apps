import { z } from "zod";
import { CATEGORIES, CHART_TYPES, DIFFICULTIES, REGIONS, VERSIONS } from "./constants.js";

// -- Receipt schema (image upload tracking) -----------------------------------

export const receiptSchema = z.object({
  imageName: z.string(),
  internalId: z.string(),
  isUploaded: z.boolean(),
  jacketFound: z.boolean(),
});

export type Receipt = z.infer<typeof receiptSchema>;

// -- Enum values derived from constants ---------------------------------------

const categoryValues = CATEGORIES.map((c) => c.category) as [string, ...string[]];
const versionValues = VERSIONS.map((v) => v.version) as [string, ...string[]];
const typeValues = CHART_TYPES.map((t) => t.type) as [string, ...string[]];
const difficultyValues = DIFFICULTIES.map((d) => d.difficulty) as [string, ...string[]];
const regionKeys = REGIONS.map((r) => r.region) as [string, ...string[]];

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

// -- Strict schema for finalized songs ----------------------------------------

const finalSheetSchema = sheetSchema.extend({
  type: z.enum(typeValues),
  difficulty: z.enum(difficultyValues),
  regions: z.object(
    Object.fromEntries(regionKeys.map((r) => [r, z.boolean()])) as Record<string, z.ZodBoolean>,
  ),
});

export const finalMaiDbSongSchema = maiDbSongSchema.extend({
  category: z.enum(categoryValues),
  version: z.enum(versionValues),
  slug: z.string().min(1),
  internalImageId: z.string().min(1),
  sheets: z.array(finalSheetSchema).min(1),
});

export type MaiDbSong = z.infer<typeof maiDbSongSchema>;
export type Sheet = z.infer<typeof sheetSchema>;

import { defineTable } from "convex/server";
import { v } from "convex/values";

export const sheets = defineTable({
  songId: v.id("songs"),
  songExternalId: v.string(),
  typeId: v.id("types"),
  difficultyId: v.id("difficulties"),
  level: v.string(),
  levelValue: v.float64(),
  internalLevel: v.union(v.string(), v.null()),
  internalLevelValue: v.float64(),
  noteDesigner: v.union(v.string(), v.null()),
  noteCounts: v.object({
    tap: v.union(v.float64(), v.null()),
    hold: v.union(v.float64(), v.null()),
    slide: v.union(v.float64(), v.null()),
    touch: v.union(v.float64(), v.null()),
    break: v.union(v.float64(), v.null()),
    total: v.union(v.float64(), v.null()),
  }),
  regions: v.object({
    jp: v.boolean(),
    intl: v.boolean(),
    usa: v.boolean(),
    cn: v.boolean(),
  }),
  regionOverrides: v.object({
    intl: v.object({
      version: v.optional(v.string()),
    }),
  }),
  isSpecial: v.boolean(),
  versionId: v.optional(v.id("versions")),
})
  .index("by_songId", ["songId"])
  .index("by_difficultyId", ["difficultyId"])
  .index("by_typeId", ["typeId"])
  .index("by_level", ["levelValue"]);

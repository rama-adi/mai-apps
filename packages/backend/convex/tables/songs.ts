import { defineTable } from "convex/server";
import { v } from "convex/values";

export const songs = defineTable({
  songId: v.string(),
  categoryId: v.id("categories"),
  title: v.string(),
  artist: v.string(),
  bpm: v.union(v.float64(), v.null()),
  imageName: v.string(),
  internalImageId: v.union(v.string(), v.null()),
  versionId: v.id("versions"),
  releaseDate: v.union(v.string(), v.null()),
  isNew: v.boolean(),
  isLocked: v.boolean(),
  slug: v.optional(v.string()),
  comment: v.union(v.string(), v.null()),
})
  .index("by_songId", ["songId"])
  .index("by_slug", ["slug"])
  .index("by_categoryId", ["categoryId"])
  .index("by_versionId", ["versionId"])
  .searchIndex("search_title", { searchField: "title" });

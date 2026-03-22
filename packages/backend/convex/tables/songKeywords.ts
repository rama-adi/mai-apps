import { defineTable } from "convex/server";
import { v } from "convex/values";

export const songKeywords = defineTable({
  songId: v.id("songs"),
  songExternalId: v.string(),
  keyword: v.string(),
})
  .index("by_songId", ["songId"])
  .searchIndex("search_keyword", {
    searchField: "keyword",
    filterFields: ["songId"],
  });

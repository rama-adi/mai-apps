import { defineTable } from "convex/server";
import { v } from "convex/values";

export const versions = defineTable({
  version: v.string(),
  abbr: v.string(),
  releaseDate: v.string(),
}).index("by_version", ["version"]);

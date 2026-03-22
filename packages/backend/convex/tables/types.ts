import { defineTable } from "convex/server";
import { v } from "convex/values";

export const types = defineTable({
  type: v.string(),
  name: v.string(),
  abbr: v.string(),
  iconUrl: v.optional(v.string()),
  iconHeight: v.optional(v.float64()),
}).index("by_type", ["type"]);

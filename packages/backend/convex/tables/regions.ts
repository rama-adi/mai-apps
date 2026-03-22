import { defineTable } from "convex/server";
import { v } from "convex/values";

export const regions = defineTable({
  region: v.string(),
  name: v.string(),
}).index("by_region", ["region"]);

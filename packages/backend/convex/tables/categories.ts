import { defineTable } from "convex/server";
import { v } from "convex/values";

export const categories = defineTable({
  category: v.string(),
}).index("by_category", ["category"]);

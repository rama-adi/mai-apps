import { defineTable } from "convex/server";
import { v } from "convex/values";

export const difficulties = defineTable({
  difficulty: v.string(),
  name: v.string(),
  color: v.string(),
}).index("by_difficulty", ["difficulty"]);

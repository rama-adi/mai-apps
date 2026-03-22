import { defineSchema } from "convex/server";
import { songs } from "./tables/songs";
import { songKeywords } from "./tables/songKeywords";
import { sheets } from "./tables/sheets";
import { categories } from "./tables/categories";
import { versions } from "./tables/versions";
import { types } from "./tables/types";
import { difficulties } from "./tables/difficulties";
import { regions } from "./tables/regions";

export default defineSchema({
  songs,
  songKeywords,
  sheets,
  categories,
  versions,
  types,
  difficulties,
  regions,
});

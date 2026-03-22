/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as seed from "../seed.js";
import type * as tables_categories from "../tables/categories.js";
import type * as tables_difficulties from "../tables/difficulties.js";
import type * as tables_regions from "../tables/regions.js";
import type * as tables_sheets from "../tables/sheets.js";
import type * as tables_songKeywords from "../tables/songKeywords.js";
import type * as tables_songs from "../tables/songs.js";
import type * as tables_types from "../tables/types.js";
import type * as tables_versions from "../tables/versions.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  seed: typeof seed;
  "tables/categories": typeof tables_categories;
  "tables/difficulties": typeof tables_difficulties;
  "tables/regions": typeof tables_regions;
  "tables/sheets": typeof tables_sheets;
  "tables/songKeywords": typeof tables_songKeywords;
  "tables/songs": typeof tables_songs;
  "tables/types": typeof tables_types;
  "tables/versions": typeof tables_versions;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {};

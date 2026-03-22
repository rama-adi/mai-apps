import type { QueryCtx } from "./_generated/server";
import { query } from "./_generated/server";
import { v } from "convex/values";
import type { Doc, Id } from "./_generated/dataModel";

type SongResult = {
  _id: Doc<"songs">["_id"];
  songId: string;
  slug: string | null;
  title: string;
  artist: string;
  bpm: number | null;
  imageName: string;
  internalImageId: string | null;
  releaseDate: string | null;
  isNew: boolean;
  isLocked: boolean;
  version: { version: string; abbr: string } | null;
  category: string | null;
};

async function resolveSongMetadata(ctx: QueryCtx, songs: Doc<"songs">[]): Promise<SongResult[]> {
  const versionIds = [...new Set(songs.map((s) => s.versionId))];
  const categoryIds = [...new Set(songs.map((s) => s.categoryId))];

  const versions = new Map<string, { version: string; abbr: string }>();
  for (const id of versionIds) {
    const ver = await ctx.db.get(id);
    if (ver) versions.set(id, { version: ver.version, abbr: ver.abbr });
  }

  const categories = new Map<string, string>();
  for (const id of categoryIds) {
    const c = await ctx.db.get(id);
    if (c) categories.set(id, c.category);
  }

  return songs.map((song) => ({
    _id: song._id,
    songId: song.songId,
    slug: song.slug ?? null,
    title: song.title,
    artist: song.artist,
    bpm: song.bpm,
    imageName: song.imageName,
    internalImageId: song.internalImageId,
    releaseDate: song.releaseDate,
    isNew: song.isNew,
    isLocked: song.isLocked,
    version: versions.get(song.versionId) ?? null,
    category: categories.get(song.categoryId) ?? null,
  }));
}

export const latestSongs = query({
  args: {},
  handler: async (ctx) => {
    const allSongs = await ctx.db.query("songs").order("desc").take(200);

    const sorted = allSongs
      .sort((a, b) => {
        const dateA = a.releaseDate ?? "";
        const dateB = b.releaseDate ?? "";
        return dateB.localeCompare(dateA);
      })
      .slice(0, 50);

    return resolveSongMetadata(ctx, sorted);
  },
});

export const searchSongs = query({
  args: {
    searchQuery: v.string(),
    categoryId: v.optional(v.id("categories")),
    versionId: v.optional(v.id("versions")),
    minBpm: v.optional(v.number()),
    maxBpm: v.optional(v.number()),
    isNew: v.optional(v.boolean()),
    difficultyId: v.optional(v.id("difficulties")),
    typeId: v.optional(v.id("types")),
    minLevel: v.optional(v.number()),
    maxLevel: v.optional(v.number()),
    region: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Search via songKeywords (contains title + community aliases)
    const keywordHits = await ctx.db
      .query("songKeywords")
      .withSearchIndex("search_keyword", (q) => q.search("keyword", args.searchQuery))
      .take(100);

    // Deduplicate song IDs
    const songIds = [...new Set(keywordHits.map((k) => k.songId))];

    // Fetch matching songs
    const songs = (await Promise.all(songIds.map((id) => ctx.db.get(id)))).filter((s) => s != null);

    let filtered = applySongFilters(songs, args);
    filtered = await applySheetFilters(ctx, filtered, args);

    return resolveSongMetadata(ctx, filtered);
  },
});

function applySongFilters(
  songs: Doc<"songs">[],
  args: {
    categoryId?: Doc<"categories">["_id"];
    versionId?: Doc<"versions">["_id"];
    minBpm?: number;
    maxBpm?: number;
    isNew?: boolean;
  },
) {
  let filtered = songs;
  if (args.categoryId) {
    filtered = filtered.filter((s) => s.categoryId === args.categoryId);
  }
  if (args.versionId) {
    filtered = filtered.filter((s) => s.versionId === args.versionId);
  }
  if (args.minBpm != null) {
    filtered = filtered.filter((s) => s.bpm != null && s.bpm >= args.minBpm!);
  }
  if (args.maxBpm != null) {
    filtered = filtered.filter((s) => s.bpm != null && s.bpm <= args.maxBpm!);
  }
  if (args.isNew != null) {
    filtered = filtered.filter((s) => s.isNew === args.isNew);
  }
  return filtered;
}

function matchesSheetFilters(
  sheet: Doc<"sheets">,
  args: {
    difficultyId?: Doc<"difficulties">["_id"];
    typeId?: Doc<"types">["_id"];
    minLevel?: number;
    maxLevel?: number;
    region?: string;
  },
) {
  if (args.difficultyId && sheet.difficultyId !== args.difficultyId) return false;
  if (args.typeId && sheet.typeId !== args.typeId) return false;
  if (args.minLevel != null && sheet.levelValue < args.minLevel) return false;
  if (args.maxLevel != null && sheet.levelValue > args.maxLevel) return false;
  if (args.region) {
    const regionKey = args.region as keyof typeof sheet.regions;
    if (!sheet.regions[regionKey]) return false;
  }
  return true;
}

// Query sheets-first: use the best sheet index, then collect matching songIds
async function findSongIdsBySheetFilters(
  ctx: QueryCtx,
  args: {
    difficultyId?: Doc<"difficulties">["_id"];
    typeId?: Doc<"types">["_id"];
    minLevel?: number;
    maxLevel?: number;
    region?: string;
  },
): Promise<Set<Id<"songs">> | null> {
  const hasSheetFilters =
    args.difficultyId ||
    args.typeId ||
    args.minLevel != null ||
    args.maxLevel != null ||
    args.region;

  if (!hasSheetFilters) return null;

  // Pick the most selective sheet index to narrow the scan
  let sheets: Doc<"sheets">[];
  if (args.difficultyId) {
    sheets = await ctx.db
      .query("sheets")
      .withIndex("by_difficultyId", (q) => q.eq("difficultyId", args.difficultyId!))
      .take(2000);
  } else if (args.typeId) {
    sheets = await ctx.db
      .query("sheets")
      .withIndex("by_typeId", (q) => q.eq("typeId", args.typeId!))
      .take(2000);
  } else if (args.minLevel != null && args.maxLevel != null) {
    sheets = await ctx.db
      .query("sheets")
      .withIndex("by_level", (q) =>
        q.gte("levelValue", args.minLevel!).lte("levelValue", args.maxLevel!),
      )
      .take(2000);
  } else if (args.minLevel != null) {
    sheets = await ctx.db
      .query("sheets")
      .withIndex("by_level", (q) => q.gte("levelValue", args.minLevel!))
      .take(2000);
  } else if (args.maxLevel != null) {
    sheets = await ctx.db
      .query("sheets")
      .withIndex("by_level", (q) => q.lte("levelValue", args.maxLevel!))
      .take(2000);
  } else {
    // Only region filter — no good index, scan all sheets
    sheets = await ctx.db.query("sheets").take(5000);
  }

  // Apply remaining sheet filters in memory and collect songIds
  const songIds = new Set<Id<"songs">>();
  for (const sheet of sheets) {
    if (matchesSheetFilters(sheet, args)) {
      songIds.add(sheet.songId);
    }
  }
  return songIds;
}

// Legacy N+1 approach for searchSongs (bounded by FTS result set, so N is small)
async function applySheetFilters(
  ctx: QueryCtx,
  songs: Doc<"songs">[],
  args: {
    difficultyId?: Doc<"difficulties">["_id"];
    typeId?: Doc<"types">["_id"];
    minLevel?: number;
    maxLevel?: number;
    region?: string;
  },
) {
  const hasSheetFilters =
    args.difficultyId ||
    args.typeId ||
    args.minLevel != null ||
    args.maxLevel != null ||
    args.region;

  if (!hasSheetFilters) return songs;

  const songIdsToKeep = new Set<string>();
  for (const song of songs) {
    const sheets = await ctx.db
      .query("sheets")
      .withIndex("by_songId", (q) => q.eq("songId", song._id))
      .collect();

    if (sheets.some((sheet) => matchesSheetFilters(sheet, args))) {
      songIdsToKeep.add(song._id);
    }
  }
  return songs.filter((s) => songIdsToKeep.has(s._id));
}

export const browseSongs = query({
  args: {
    categoryId: v.optional(v.id("categories")),
    versionId: v.optional(v.id("versions")),
    minBpm: v.optional(v.number()),
    maxBpm: v.optional(v.number()),
    isNew: v.optional(v.boolean()),
    difficultyId: v.optional(v.id("difficulties")),
    typeId: v.optional(v.id("types")),
    minLevel: v.optional(v.number()),
    maxLevel: v.optional(v.number()),
    region: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Step 1: If sheet filters exist, find matching songIds via sheet indexes first
    const matchingSongIds = await findSongIdsBySheetFilters(ctx, args);

    // Step 2: If we have songIds from sheets, fetch those songs directly by ID
    // Otherwise, query songs table with the best available index
    let songs: Doc<"songs">[];
    if (matchingSongIds != null) {
      // Fetch only songs that have matching sheets — no N+1, just direct lookups
      const fetched = await Promise.all([...matchingSongIds].map((id) => ctx.db.get(id)));
      songs = fetched.filter((s): s is Doc<"songs"> => s != null);
    } else {
      // No sheet filters — use best song index
      let dbQuery;
      if (args.categoryId) {
        dbQuery = ctx.db
          .query("songs")
          .withIndex("by_categoryId", (q) => q.eq("categoryId", args.categoryId!));
      } else if (args.versionId) {
        dbQuery = ctx.db
          .query("songs")
          .withIndex("by_versionId", (q) => q.eq("versionId", args.versionId!));
      } else {
        dbQuery = ctx.db.query("songs");
      }
      songs = await dbQuery.order("desc").take(200);
    }

    // Step 3: Apply song-level filters in memory
    const filtered = applySongFilters(songs, args);

    // Sort by newest first
    filtered.sort((a, b) => (b.releaseDate ?? "").localeCompare(a.releaseDate ?? ""));

    return resolveSongMetadata(ctx, filtered);
  },
});

export const getSongBySlug = query({
  args: { slug: v.string() },
  handler: async (ctx, args) => {
    const song = await ctx.db
      .query("songs")
      .withIndex("by_slug", (q) => q.eq("slug", args.slug))
      .unique();

    if (!song) return null;

    // Resolve version & category
    const version = await ctx.db.get(song.versionId);
    const category = await ctx.db.get(song.categoryId);

    // Fetch all sheets for this song
    const sheets = await ctx.db
      .query("sheets")
      .withIndex("by_songId", (q) => q.eq("songId", song._id))
      .collect();

    // Resolve sheet metadata (difficulty, type names)
    const difficultyIds = [...new Set(sheets.map((s) => s.difficultyId))];
    const typeIds = [...new Set(sheets.map((s) => s.typeId))];

    const difficulties = new Map<string, { difficulty: string; name: string; color: string }>();
    for (const id of difficultyIds) {
      const d = await ctx.db.get(id);
      if (d) difficulties.set(id, { difficulty: d.difficulty, name: d.name, color: d.color });
    }

    const types = new Map<string, { type: string; name: string; abbr: string }>();
    for (const id of typeIds) {
      const t = await ctx.db.get(id);
      if (t) types.set(id, { type: t.type, name: t.name, abbr: t.abbr });
    }

    return {
      _id: song._id,
      songId: song.songId,
      slug: song.slug ?? null,
      title: song.title,
      artist: song.artist,
      bpm: song.bpm,
      imageName: song.imageName,
      internalImageId: song.internalImageId,
      releaseDate: song.releaseDate,
      isNew: song.isNew,
      isLocked: song.isLocked,
      comment: song.comment,
      version: version ? { version: version.version, abbr: version.abbr } : null,
      category: category ? category.category : null,
      sheets: sheets.map((sheet) => ({
        _id: sheet._id,
        difficulty: difficulties.get(sheet.difficultyId) ?? null,
        type: types.get(sheet.typeId) ?? null,
        level: sheet.level,
        levelValue: sheet.levelValue,
        internalLevel: sheet.internalLevel,
        internalLevelValue: sheet.internalLevelValue,
        noteDesigner: sheet.noteDesigner,
        noteCounts: sheet.noteCounts,
        regions: sheet.regions,
        isSpecial: sheet.isSpecial,
      })),
    };
  },
});

export const filterOptions = query({
  args: {},
  handler: async (ctx) => {
    const categories = await ctx.db.query("categories").collect();
    const versions = await ctx.db.query("versions").collect();
    const difficulties = await ctx.db.query("difficulties").collect();
    const types = await ctx.db.query("types").collect();
    const regions = await ctx.db.query("regions").collect();

    return {
      categories: categories.map((c) => ({ _id: c._id, category: c.category })),
      versions: versions
        .sort((a, b) => b.releaseDate.localeCompare(a.releaseDate))
        .map((ver) => ({ _id: ver._id, version: ver.version, abbr: ver.abbr })),
      difficulties: difficulties.map((d) => ({
        _id: d._id,
        difficulty: d.difficulty,
        name: d.name,
        color: d.color,
      })),
      types: types.map((t) => ({ _id: t._id, type: t.type, name: t.name, abbr: t.abbr })),
      regions: regions.map((r) => ({ _id: r._id, region: r.region, name: r.name })),
    };
  },
});

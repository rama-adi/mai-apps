import { query } from "./_generated/server";
import { v } from "convex/values";
import type { Doc } from "./_generated/dataModel";

type SongResult = {
  _id: Doc<"songs">["_id"];
  songId: string;
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

async function resolveSongMetadata(
  ctx: { db: Doc<"songs"> extends never ? never : any },
  songs: Doc<"songs">[],
): Promise<SongResult[]> {
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

    // Apply song-level filters
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

    // Apply sheet-level filters (difficulty, type, level, region)
    const hasSheetFilters =
      args.difficultyId ||
      args.typeId ||
      args.minLevel != null ||
      args.maxLevel != null ||
      args.region;

    if (hasSheetFilters) {
      const songIdsToKeep = new Set<string>();
      for (const song of filtered) {
        const sheets = await ctx.db
          .query("sheets")
          .withIndex("by_songId", (q) => q.eq("songId", song._id))
          .collect();

        const hasMatch = sheets.some((sheet) => {
          if (args.difficultyId && sheet.difficultyId !== args.difficultyId) return false;
          if (args.typeId && sheet.typeId !== args.typeId) return false;
          if (args.minLevel != null && sheet.levelValue < args.minLevel) return false;
          if (args.maxLevel != null && sheet.levelValue > args.maxLevel) return false;
          if (args.region) {
            const regionKey = args.region as keyof typeof sheet.regions;
            if (!sheet.regions[regionKey]) return false;
          }
          return true;
        });

        if (hasMatch) songIdsToKeep.add(song._id);
      }
      filtered = filtered.filter((s) => songIdsToKeep.has(s._id));
    }

    return resolveSongMetadata(ctx, filtered);
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

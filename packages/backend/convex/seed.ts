/// <reference types="node" />
import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const seedLookups = mutation({
  args: {
    secret: v.string(),
    categories: v.any(),
    versions: v.any(),
    types: v.any(),
    difficulties: v.any(),
    regions: v.any(),
  },
  handler: async (ctx, { secret, categories, versions, types, difficulties, regions }) => {
    const expected = process.env.SEED_SECRET;
    if (!expected || secret !== expected) {
      throw new Error("Unauthorized");
    }

    // Return [key, id] tuples instead of objects to avoid
    // Convex field-name restrictions on non-ASCII characters.

    const categoryEntries: Array<[string, string]> = [];
    for (const c of categories) {
      const existing = await ctx.db
        .query("categories")
        .withIndex("by_category", (q) => q.eq("category", c.category))
        .first();
      if (existing) {
        categoryEntries.push([c.category, existing._id]);
      } else {
        const id = await ctx.db.insert("categories", { category: c.category });
        categoryEntries.push([c.category, id]);
      }
    }

    const versionEntries: Array<[string, string]> = [];
    for (const ver of versions) {
      const existing = await ctx.db
        .query("versions")
        .withIndex("by_version", (q) => q.eq("version", ver.version))
        .first();
      if (existing) {
        await ctx.db.patch(existing._id, { abbr: ver.abbr, releaseDate: ver.releaseDate });
        versionEntries.push([ver.version, existing._id]);
      } else {
        const id = await ctx.db.insert("versions", {
          version: ver.version,
          abbr: ver.abbr,
          releaseDate: ver.releaseDate,
        });
        versionEntries.push([ver.version, id]);
      }
    }

    const typeEntries: Array<[string, string]> = [];
    for (const t of types) {
      const existing = await ctx.db
        .query("types")
        .withIndex("by_type", (q) => q.eq("type", t.type))
        .first();
      if (existing) {
        await ctx.db.patch(existing._id, {
          name: t.name,
          abbr: t.abbr,
          iconUrl: t.iconUrl,
          iconHeight: t.iconHeight,
        });
        typeEntries.push([t.type, existing._id]);
      } else {
        const id = await ctx.db.insert("types", {
          type: t.type,
          name: t.name,
          abbr: t.abbr,
          iconUrl: t.iconUrl,
          iconHeight: t.iconHeight,
        });
        typeEntries.push([t.type, id]);
      }
    }

    const difficultyEntries: Array<[string, string]> = [];
    for (const d of difficulties) {
      const existing = await ctx.db
        .query("difficulties")
        .withIndex("by_difficulty", (q) => q.eq("difficulty", d.difficulty))
        .first();
      if (existing) {
        await ctx.db.patch(existing._id, { name: d.name, color: d.color });
        difficultyEntries.push([d.difficulty, existing._id]);
      } else {
        const id = await ctx.db.insert("difficulties", {
          difficulty: d.difficulty,
          name: d.name,
          color: d.color,
        });
        difficultyEntries.push([d.difficulty, id]);
      }
    }

    const regionEntries: Array<[string, string]> = [];
    for (const r of regions) {
      const existing = await ctx.db
        .query("regions")
        .withIndex("by_region", (q) => q.eq("region", r.region))
        .first();
      if (existing) {
        await ctx.db.patch(existing._id, { name: r.name });
        regionEntries.push([r.region, existing._id]);
      } else {
        const id = await ctx.db.insert("regions", {
          region: r.region,
          name: r.name,
        });
        regionEntries.push([r.region, id]);
      }
    }

    return {
      categoryEntries,
      versionEntries,
      typeEntries,
      difficultyEntries,
      regionEntries,
    };
  },
});

export const clearTable = mutation({
  args: {
    secret: v.string(),
    table: v.string(),
  },
  handler: async (ctx, { secret, table }) => {
    const expected = process.env.SEED_SECRET;
    if (!expected || secret !== expected) {
      throw new Error("Unauthorized");
    }

    const docs = await ctx.db.query(table as any).take(1000);
    for (const doc of docs) {
      await ctx.db.delete(doc._id);
    }
    return docs.length;
  },
});

export const getSongsWithoutImages = query({
  args: { secret: v.string() },
  handler: async (ctx, { secret }) => {
    const expected = process.env.SEED_SECRET;
    if (!expected || secret !== expected) {
      throw new Error("Unauthorized");
    }

    // Build reverse lookup maps
    const categories = await ctx.db.query("categories").collect();
    const catMap = new Map(categories.map((c) => [c._id, c.category]));

    const types = await ctx.db.query("types").collect();
    const typeMap = new Map(types.map((t) => [t._id, t.type]));

    const difficulties = await ctx.db.query("difficulties").collect();
    const diffMap = new Map(difficulties.map((d) => [d._id, d.difficulty]));

    const versions = await ctx.db.query("versions").collect();
    const verMap = new Map(versions.map((v) => [v._id, v.version]));

    // Get songs missing images
    const allSongs = await ctx.db.query("songs").collect();
    const missing = allSongs.filter((s) => !s.internalImageId);

    // Get sheets for each missing song and assemble entries
    const entries = [];
    for (const s of missing) {
      const sheets = await ctx.db
        .query("sheets")
        .withIndex("by_songId", (q) => q.eq("songId", s._id))
        .collect();

      entries.push({
        song: {
          songId: s.songId,
          category: catMap.get(s.categoryId) ?? s.categoryId,
          title: s.title,
          artist: s.artist,
          bpm: s.bpm,
          imageName: s.imageName,
          version: verMap.get(s.versionId) ?? s.versionId,
          releaseDate: s.releaseDate,
          isNew: s.isNew,
          isLocked: s.isLocked,
          comment: s.comment,
          internalImageId: null,
        },
        sheets: sheets.map((sh) => ({
          type: typeMap.get(sh.typeId) ?? sh.typeId,
          difficulty: diffMap.get(sh.difficultyId) ?? sh.difficultyId,
          level: sh.level,
          levelValue: sh.levelValue,
          internalLevel: sh.internalLevel,
          internalLevelValue: sh.internalLevelValue,
          noteDesigner: sh.noteDesigner,
          noteCounts: sh.noteCounts,
          regions: sh.regions,
          regionOverrides: sh.regionOverrides,
          isSpecial: sh.isSpecial,
        })),
      });
    }

    return entries;
  },
});

export const backfillImageIds = mutation({
  args: {
    secret: v.string(),
    patches: v.any(),
  },
  handler: async (ctx, { secret, patches }) => {
    const expected = process.env.SEED_SECRET;
    if (!expected || secret !== expected) {
      throw new Error("Unauthorized");
    }

    for (const { songId, internalImageId } of patches) {
      const existing = await ctx.db
        .query("songs")
        .withIndex("by_songId", (q) => q.eq("songId", songId))
        .first();
      if (existing) {
        await ctx.db.patch(existing._id, { internalImageId });
      } else {
        console.warn(`Song not found: ${songId}`);
      }
    }
  },
});

export const getSongsWithoutSlugs = query({
  args: { secret: v.string() },
  handler: async (ctx, { secret }) => {
    const expected = process.env.SEED_SECRET;
    if (!expected || secret !== expected) {
      throw new Error("Unauthorized");
    }

    const allSongs = await ctx.db.query("songs").collect();
    return allSongs
      .filter((s) => !s.slug)
      .map((s) => ({ _id: s._id, title: s.title, artist: s.artist }));
  },
});

export const backfillSlugs = mutation({
  args: {
    secret: v.string(),
    patches: v.array(v.object({ id: v.id("songs"), slug: v.string() })),
  },
  handler: async (ctx, { secret, patches }) => {
    const expected = process.env.SEED_SECRET;
    if (!expected || secret !== expected) {
      throw new Error("Unauthorized");
    }

    for (const { id, slug } of patches) {
      await ctx.db.patch(id, { slug });
    }
  },
});

export const upsertSongBatch = mutation({
  args: {
    secret: v.string(),
    entries: v.any(),
  },
  handler: async (ctx, { secret, entries }) => {
    const expected = process.env.SEED_SECRET;
    if (!expected || secret !== expected) {
      throw new Error("Unauthorized");
    }

    for (const { song, sheets, keyword } of entries) {
      const existing = await ctx.db
        .query("songs")
        .withIndex("by_songId", (q) => q.eq("songId", song.songId))
        .first();

      let songDocId;
      if (existing) {
        await ctx.db.replace(existing._id, song);
        songDocId = existing._id;
      } else {
        songDocId = await ctx.db.insert("songs", song);
      }

      // Clear existing sheets for this song
      const oldSheets = await ctx.db
        .query("sheets")
        .withIndex("by_songId", (q) => q.eq("songId", songDocId))
        .collect();
      for (const s of oldSheets) {
        await ctx.db.delete(s._id);
      }

      // Clear existing keywords for this song
      const oldKeywords = await ctx.db
        .query("songKeywords")
        .withIndex("by_songId", (q) => q.eq("songId", songDocId))
        .collect();
      for (const k of oldKeywords) {
        await ctx.db.delete(k._id);
      }

      // Insert sheets
      for (const sheet of sheets) {
        await ctx.db.insert("sheets", {
          songId: songDocId,
          songExternalId: song.songId,
          ...sheet,
        });
      }

      // Insert keyword
      await ctx.db.insert("songKeywords", {
        songId: songDocId,
        songExternalId: song.songId,
        keyword,
      });
    }
  },
});

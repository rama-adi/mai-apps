import seoData from "virtual:songs-seo";
import seoSlugs from "virtual:songs-seo-slugs";
import type { SongSeoEntry } from "maidb-data";

let cache: Map<string, SongSeoEntry> | null = null;
let slugCache: Set<string> | null = null;

function getMap(): Map<string, SongSeoEntry> {
  if (!cache) {
    cache = new Map();
    for (const entry of seoData) {
      cache.set(entry.slug, entry);
    }
  }
  return cache;
}

export function getSongSeoBySlug(slug: string): SongSeoEntry | null {
  return getMap().get(slug) ?? null;
}

export function hasSongSeo(slug: string): boolean {
  if (!slugCache) slugCache = new Set(seoSlugs);
  return slugCache.has(slug);
}

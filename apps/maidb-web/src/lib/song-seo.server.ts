import seoData from "virtual:songs-seo";
import type { SongSeoEntry } from "maidb-data";

let cache: Map<string, SongSeoEntry> | null = null;

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

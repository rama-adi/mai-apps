import { env } from "cloudflare:workers";
import type { MaiDbSong, Metadata } from "maidb-data";

import localSongsJson from "maidb-data/data/songs/songs.json";
import localLatestJson from "maidb-data/data/songs/latest-only.json";
import localMetadataJson from "maidb-data/data/songs/metadata.json";
import { buildFilterOptions, sortSongsByReleaseDate, type FilterOptions } from "maidb-data";

const SONGS_OBJECT_KEY = "songs.json";
const SONGS_CACHE_KEY = "songlist:v1";
const SONGS_CACHE_TTL_SECONDS = 60 * 60;

type SongListPayload = {
  songs: MaiDbSong[];
  source: "kv" | "r2" | "local";
};

export async function loadSongList(): Promise<SongListPayload> {
  const cachedSongs = await env.SONGS_CACHE.get(SONGS_CACHE_KEY, "text");
  if (cachedSongs) {
    return { songs: JSON.parse(cachedSongs) as MaiDbSong[], source: "kv" };
  }

  const r2Object = await env.SONG_DATA_BUCKET.get(SONGS_OBJECT_KEY);
  if (r2Object) {
    const songsText = await r2Object.text();
    await env.SONGS_CACHE.put(SONGS_CACHE_KEY, songsText, {
      expirationTtl: SONGS_CACHE_TTL_SECONDS,
    });
    return { songs: JSON.parse(songsText) as MaiDbSong[], source: "r2" };
  }

  return { songs: localSongsJson as MaiDbSong[], source: "local" };
}

export async function loadSongListResponse(): Promise<Response> {
  const { songs, source } = await loadSongList();

  return new Response(JSON.stringify(songs), {
    headers: {
      "cache-control": "public, max-age=300, s-maxage=3600, stale-while-revalidate=86400",
      "content-type": "application/json; charset=utf-8",
      "x-songlist-source": source,
    },
  });
}

export function getLatestSongs(): MaiDbSong[] {
  return localLatestJson as MaiDbSong[];
}

export function getMetadata(): Metadata {
  return localMetadataJson as Metadata;
}

export async function getSongsByVersion(versionSlug: string): Promise<MaiDbSong[]> {
  const { songs } = await loadSongList();
  return sortSongsByReleaseDate(songs.filter((song) => song.version === versionSlug));
}

export async function getSongBySlug(slug: string): Promise<MaiDbSong | null> {
  const { songs } = await loadSongList();
  return songs.find((song) => song.slug === slug) ?? null;
}

export async function getAllSlugs(): Promise<string[]> {
  const { songs } = await loadSongList();
  return songs.map((song) => song.slug);
}

export async function getFilterOptions(): Promise<FilterOptions> {
  const { songs } = await loadSongList();
  return buildFilterOptions(songs);
}

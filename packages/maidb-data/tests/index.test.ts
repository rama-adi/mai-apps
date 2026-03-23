import { expect, test } from "vite-plus/test";
import { filterSongs, maiDbSongSchema, searchSongsByKeyword } from "../src";
import type { MaiDbSong } from "../src";

test("maiDbSongSchema is defined", () => {
  expect(maiDbSongSchema).toBeDefined();
});

function createSong(overrides: Partial<MaiDbSong>): MaiDbSong {
  return {
    songId: "song-id",
    category: "POPS & ANIME",
    title: "Song Title",
    artist: "Artist",
    bpm: 180,
    imageName: "song.png",
    version: "maimai DX",
    releaseDate: "2024-01-01",
    isNew: false,
    isLocked: false,
    comment: null,
    slug: "song-title",
    internalImageId: "image-id",
    keyword: "song title artist",
    sheets: [
      {
        type: "std",
        difficulty: "expert",
        level: "12",
        levelValue: 12,
        internalLevel: null,
        internalLevelValue: 12,
        noteDesigner: "Designer",
        noteCounts: {
          tap: 100,
          hold: 20,
          slide: 30,
          touch: 0,
          break: 10,
          total: 160,
        },
        regions: {
          jp: true,
          intl: true,
          usa: true,
          cn: true,
        },
        regionOverrides: {
          intl: {},
        },
        isSpecial: false,
      },
    ],
    ...overrides,
  };
}

test("searchSongsByKeyword sorts matches by newest release date first", () => {
  const olderSong = createSong({
    songId: "older-song",
    title: "Cyber Beat",
    slug: "cyber-beat-old",
    releaseDate: "2022-02-01",
    keyword: "cyber beat",
  });
  const newerSong = createSong({
    songId: "newer-song",
    title: "Cyber Beat Re:Fresh",
    slug: "cyber-beat-new",
    releaseDate: "2025-04-01",
    keyword: "cyber beat refresh",
    isNew: true,
  });

  expect(searchSongsByKeyword([olderSong, newerSong], "cyber").map((song) => song.songId)).toEqual([
    "newer-song",
    "older-song",
  ]);
});

test("searchSongsByKeyword uses a stricter fuse threshold", () => {
  const matchingSong = createSong({
    songId: "matching-song",
    title: "Starlight",
    slug: "starlight",
    keyword: "starlight anthem",
  });
  const weakMatchSong = createSong({
    songId: "weak-match-song",
    title: "Moonlight",
    slug: "moonlight",
    keyword: "moonlight parade",
  });

  expect(
    searchSongsByKeyword([matchingSong, weakMatchSong], "starlit").map((song) => song.songId),
  ).toEqual(["matching-song"]);
});

test("filterSongs returns searched matches newest first", () => {
  const oldestSong = createSong({
    songId: "oldest-song",
    title: "Aurora",
    slug: "aurora-oldest",
    releaseDate: "2020-01-01",
    keyword: "aurora sky",
  });
  const newestSong = createSong({
    songId: "newest-song",
    title: "Aurora Burst",
    slug: "aurora-burst",
    releaseDate: "2025-01-01",
    keyword: "aurora burst",
  });

  expect(filterSongs([oldestSong, newestSong], { q: "aurora" }).map((song) => song.songId)).toEqual(
    ["newest-song", "oldest-song"],
  );
});

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

test("filterSongs applies keyword search before level filtering", () => {
  const keywordAndLevelMatch = createSong({
    songId: "keyword-and-level-match",
    title: "Aurora Expert",
    slug: "aurora-expert",
    keyword: "aurora expert",
    sheets: [
      {
        ...createSong({}).sheets[0],
        difficulty: "expert",
        level: "12",
        levelValue: 12,
      },
    ],
  });
  const levelOnlyMatch = createSong({
    songId: "level-only-match",
    title: "Completely Different",
    slug: "different-song",
    keyword: "different song",
    releaseDate: "2025-06-01",
    sheets: [
      {
        ...createSong({}).sheets[0],
        difficulty: "expert",
        level: "12",
        levelValue: 12,
      },
    ],
  });

  expect(
    filterSongs([levelOnlyMatch, keywordAndLevelMatch], {
      q: "aurora",
      minLevel: 12,
      maxLevel: 12,
    }).map((song) => song.songId),
  ).toEqual(["keyword-and-level-match"]);
});

test("filterSongs requires the same visible chart to satisfy difficulty and level filters", () => {
  const mismatchedSong = createSong({
    songId: "mismatched-song",
    slug: "mismatched-song",
    sheets: [
      {
        ...createSong({}).sheets[0],
        difficulty: "basic",
        level: "12",
        levelValue: 12,
      },
      {
        ...createSong({}).sheets[0],
        difficulty: "expert",
        level: "8",
        levelValue: 8,
      },
    ],
  });
  const matchingSong = createSong({
    songId: "matching-song",
    slug: "matching-song",
    sheets: [
      {
        ...createSong({}).sheets[0],
        difficulty: "expert",
        level: "12",
        levelValue: 12,
      },
    ],
  });

  expect(
    filterSongs([mismatchedSong, matchingSong], {
      difficulty: "expert",
      minLevel: 12,
      maxLevel: 12,
    }).map((song) => song.songId),
  ).toEqual(["matching-song"]);
});

test("filterSongs excludes utage or special-only matches from level results", () => {
  const utageOnlyMatch = createSong({
    songId: "utage-only-match",
    slug: "utage-only-match",
    sheets: [
      {
        ...createSong({}).sheets[0],
        type: "utage",
        isSpecial: true,
        level: "12",
        levelValue: 12,
      },
    ],
  });
  const normalMatch = createSong({
    songId: "normal-match",
    slug: "normal-match",
  });

  expect(
    filterSongs([utageOnlyMatch, normalMatch], {
      minLevel: 12,
      maxLevel: 12,
    }).map((song) => song.songId),
  ).toEqual(["normal-match"]);
});

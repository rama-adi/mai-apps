import { expect, test } from "vite-plus/test";
import { filterSongs, searchSongsByKeyword, type MaiDbSong } from "maidb-data";

function makeSong(overrides: Partial<MaiDbSong>): MaiDbSong {
  return {
    songId: "song-1",
    category: "POPS & ANIME",
    title: "Default Song",
    artist: "Test Artist",
    bpm: 180,
    imageName: "default.png",
    version: "BUDDIES",
    releaseDate: "2024-01-01",
    isNew: false,
    isLocked: false,
    comment: null,
    slug: "default-song",
    internalImageId: "default-song",
    keyword: "default song",
    sheets: [
      {
        type: "std",
        difficulty: "basic",
        level: "1",
        levelValue: 1,
        internalLevel: null,
        internalLevelValue: 1,
        noteDesigner: "tester",
        noteCounts: {
          tap: 1,
          hold: 1,
          slide: 1,
          touch: 1,
          break: 1,
          total: 5,
        },
        regions: {
          jp: true,
          intl: true,
          usa: true,
          cn: false,
        },
        regionOverrides: { intl: {} },
        isSpecial: false,
      },
    ],
    ...overrides,
  };
}

test("searchSongsByKeyword returns ranked keyword matches", () => {
  const songs = [
    makeSong({
      songId: "exact",
      title: "Moonlight Dance",
      slug: "moonlight-dance",
      internalImageId: "moonlight-dance",
      keyword: "moonlight dance",
    }),
    makeSong({
      songId: "partial",
      title: "Dancing in the Night",
      slug: "dancing-in-the-night",
      internalImageId: "dancing-in-the-night",
      keyword: "dancing night moon",
    }),
  ];

  expect(searchSongsByKeyword(songs, "moon")).toEqual([songs[0], songs[1]]);
});

test("filterSongs applies fuse keyword search after exact filters", () => {
  const songs = [
    makeSong({
      songId: "jp-hit",
      title: "Starlight",
      slug: "starlight",
      internalImageId: "starlight",
      keyword: "starlight sparkle",
      category: "niconico & VOCALOID",
    }),
    makeSong({
      songId: "other-category",
      title: "Starlight Remix",
      slug: "starlight-remix",
      internalImageId: "starlight-remix",
      keyword: "starlight remix",
      category: "GAME & VARIETY",
    }),
  ];

  expect(filterSongs(songs, { q: "starlight", category: "niconico & VOCALOID" })).toEqual([
    songs[0],
  ]);
});

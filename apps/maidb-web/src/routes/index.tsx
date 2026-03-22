import { createFileRoute } from "@tanstack/react-router";
import type { MaiDbSong } from "maidb-data";
import { getLatestSongs, getFilterOptions } from "./-index.functions";
import {
  SongBrowser,
  type SongBrowserFilterOptions,
  validateSongBrowserSearch,
} from "../components/song-browser";

export const Route = createFileRoute("/")({
  validateSearch: validateSongBrowserSearch,
  head: () => ({
    meta: [
      { title: "MaiDB - Browse the Complete maimai Song Database" },
      {
        name: "description",
        content:
          "Explore every maimai song and chart. Browse difficulty levels, BPM, version history, and more — all in one place.",
      },
      { property: "og:title", content: "MaiDB - maimai Song Database" },
      {
        property: "og:description",
        content:
          "Browse the complete maimai song catalog with charts, difficulties, BPM, and version history.",
      },
    ],
  }),
  loader: async () => {
    const [songs, filterOptions] = await Promise.all([
      getLatestSongs({ data: { limit: 50 } }),
      getFilterOptions(),
    ]);
    return { songs, filterOptions };
  },
  component: HomePage,
});

function HomePage() {
  const { songs: loaderSongs, filterOptions } = Route.useLoaderData() as {
    songs: MaiDbSong[];
    filterOptions: SongBrowserFilterOptions;
  };
  const search = Route.useSearch();
  return (
    <SongBrowser
      loaderSongs={loaderSongs}
      filterOptions={filterOptions}
      search={search}
      navigationTarget="/"
    />
  );
}

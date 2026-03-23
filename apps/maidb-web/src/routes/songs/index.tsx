import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { sortSongsByReleaseDate, type MaiDbSong } from "maidb-data";
import { ArrowLeft } from "lucide-react";
import { SongBrowser } from "../../components/song-browser/SongBrowser";
import { SongBrowserFilters } from "../../components/song-browser/SongBrowserFilters";
import { SongBrowserGrid } from "../../components/song-browser/SongBrowserGrid";
import { SongBrowserSearchBar } from "../../components/song-browser/SongBrowserSearchBar";
import {
  validateSongBrowserSearch,
  type SongBrowserFilterOptions,
  type SongBrowserSearchParams,
} from "../../components/song-browser/song-browser.types";
import { getSongsPageLatest, getSongsPageFilterOptions } from "../-server/songs-index";

export const Route = createFileRoute("/songs/")({
  validateSearch: validateSongBrowserSearch,
  head: () => ({
    meta: [
      { title: "Browse Songs - MaiDB" },
      {
        name: "description",
        content:
          "Explore every maimai song and chart. Browse difficulty levels, BPM, version history, and more.",
      },
    ],
  }),
  loader: async () => {
    const [songs, filterOptions] = await Promise.all([
      getSongsPageLatest(),
      getSongsPageFilterOptions(),
    ]);
    return { songs, filterOptions };
  },
  component: SongBrowserPage,
});

function SongBrowserPage() {
  const { songs: loaderSongs, filterOptions } = Route.useLoaderData() as {
    songs: MaiDbSong[];
    filterOptions: SongBrowserFilterOptions;
  };
  const search = Route.useSearch();
  const navigate = useNavigate({ from: "/songs/" });

  const navigateWithSearch = (
    updater: (prev: SongBrowserSearchParams) => SongBrowserSearchParams,
  ) =>
    void navigate({
      to: "/songs",
      search: (prev) => updater(prev as SongBrowserSearchParams),
      replace: true,
    });

  const openSongModal = (song: MaiDbSong) => {
    const from =
      typeof window !== "undefined"
        ? `${window.location.pathname}${window.location.search}${window.location.hash}`
        : "/songs";

    void navigate({
      to: "/song-modal/$slug",
      params: { slug: song.slug },
      search: { ...search, from },
      resetScroll: false,
      mask: {
        to: "/songs/$slug",
        params: { slug: song.slug },
        unmaskOnReload: true,
      },
    });
  };

  return (
    <main className="mx-auto max-w-5xl flex-1 px-4 pb-12 pt-6">
      {/* Back nav */}
      <Link
        to="/"
        className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        Home
      </Link>

      {/* Search bar — sticks below the navbar */}
      <SongBrowser
        initialSongs={loaderSongs}
        filterOptions={filterOptions}
        search={search}
        onSearchChange={navigateWithSearch}
        paginationMode="infinite"
        resolveHydratedSongs={sortSongsByReleaseDate}
      >
        <section className="sticky top-[53px] z-10 -mx-4 border-b bg-background/80 px-4 pb-3 pt-2 backdrop-blur-lg">
          <SongBrowserSearchBar />
          <SongBrowserFilters />
        </section>
        <SongBrowserGrid onSongSelect={openSongModal} />
      </SongBrowser>
    </main>
  );
}

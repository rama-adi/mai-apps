import { createFileRoute, Link, Outlet, useNavigate } from "@tanstack/react-router";
import { sortSongsByReleaseDate, type MaiDbSong } from "maidb-data";
import { ArrowLeft } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { SongBrowser } from "../../../components/song-browser/SongBrowser";
import { SongBrowserFilters } from "../../../components/song-browser/SongBrowserFilters";
import { SongBrowserGridView } from "../../../components/song-browser/SongBrowserGridView";
import { SongBrowserSearchBar } from "../../../components/song-browser/SongBrowserSearchBar";
import { SongCatalogProvider } from "../../../lib/song-catalog";
import {
  type SongBrowserFilterOptions,
  type SongBrowserSearchParams,
  validateSongBrowserSearch,
} from "../../../components/song-browser/song-browser.types";
import { getSongsPageFiltersData, getSongsPageSongs } from "../../-server/songs-index";

export const Route = createFileRoute("/(song-browser-songs)/songs")({
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
      getSongsPageSongs(),
      getSongsPageFiltersData(),
    ]);
    return { songs, filterOptions };
  },
  component: SongBrowserPage,
});

function useStuck() {
  const [isStuck, setIsStuck] = useState(false);
  const stickyRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const element = stickyRef.current;
    if (!element) return;

    // Create a sentinel element that's positioned at the top of the viewport offset
    // When this leaves the viewport, the sticky element is "stuck"
    const sentinel = document.createElement("div");
    sentinel.style.position = "absolute";
    sentinel.style.top = "54px"; // Navbar height
    sentinel.style.left = "0";
    sentinel.style.height = "1px";
    sentinel.style.width = "100%";
    sentinel.style.visibility = "hidden";
    sentinel.style.pointerEvents = "none";

    // Insert as first child of the sticky element's parent
    element.parentElement?.insertBefore(sentinel, element);

    const observer = new IntersectionObserver(
      ([entry]) => {
        // When sentinel is not intersecting (scrolled past), element is stuck
        setIsStuck(!entry.isIntersecting);
      },
      { threshold: 0, rootMargin: "0px" },
    );

    observer.observe(sentinel);

    return () => {
      observer.disconnect();
      sentinel.remove();
    };
  }, []);

  return { isStuck, stickyRef };
}

function SongBrowserPage() {
  const { songs: loaderSongs, filterOptions } = Route.useLoaderData() as {
    songs: MaiDbSong[];
    filterOptions: SongBrowserFilterOptions;
  };
  const search = Route.useSearch();
  const navigate = useNavigate({ from: "/songs" });
  const { isStuck, stickyRef } = useStuck();

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
      to: "/songs/modal/$slug",
      params: { slug: song.slug },
      search: { ...search, from },
      resetScroll: false,
      viewTransition: true,
      mask: {
        to: "/songs/$slug",
        params: { slug: song.slug },
        unmaskOnReload: true,
      },
    });
  };

  return (
    <SongCatalogProvider initialSongs={loaderSongs}>
      <main
        className="mx-auto w-full max-w-5xl flex-1 px-4 pb-12 pt-6"
        data-song-browser-surface=""
      >
        <SongBrowser
          initialSongs={loaderSongs}
          filterOptions={filterOptions}
          search={search}
          onSearchChange={navigateWithSearch}
          paginationMode="infinite"
          resolveHydratedSongs={sortSongsByReleaseDate}
        >
          {/* Sticky header: Back link + Search + Filters */}
          <section
            ref={stickyRef}
            className={[
              "sticky top-[53px] z-10 -mx-4 bg-background/80 px-4 pb-3 pt-2 backdrop-blur-lg",
              "transition-all duration-200 ease-out motion-reduce:transition-none motion-reduce:duration-0",
              isStuck ? "border-b border-border/60" : "border-b border-transparent",
            ].join(" ")}
          >
            {/* Back nav */}
            <Link
              to="/"
              className="mb-3 inline-flex items-center gap-1.5 px-2 py-1 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Home
            </Link>
            <SongBrowserSearchBar />
            <SongBrowserFilters />
          </section>
          <SongBrowserGridView onSongSelect={openSongModal} />
        </SongBrowser>
        <Outlet />
      </main>
    </SongCatalogProvider>
  );
}

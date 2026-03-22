import { createFileRoute, useNavigate } from "@tanstack/react-router";
import type { MaiDbSong } from "maidb-data";
import { X } from "lucide-react";
import { useState } from "react";
import { getLatestSongs, getFilterOptions } from "./-index.functions";
import { getSongBySlug } from "./-songs.$slug.functions";
import {
  SongBrowser,
  type SongBrowserFilterOptions,
  validateSongBrowserSearch,
} from "../components/song-browser";
import { SongDetail, SongDetailSkeleton } from "../components/SongDetail";
import { useSongBySlug } from "../lib/use-songs";

export const Route = createFileRoute("/song-modal/$slug")({
  validateSearch: validateSongBrowserSearch,
  loader: async ({ params }) => {
    const [songs, filterOptions, song] = await Promise.all([
      getLatestSongs({ data: { limit: 50 } }),
      getFilterOptions(),
      getSongBySlug({ data: { slug: params.slug } }),
    ]);

    return { songs, filterOptions, song };
  },
  component: SongModalPage,
});

function SongModalPage() {
  const {
    songs,
    filterOptions,
    song: loaderSong,
  } = Route.useLoaderData() as {
    songs: MaiDbSong[];
    filterOptions: SongBrowserFilterOptions;
    song: MaiDbSong | null;
  };
  const search = Route.useSearch();
  const { slug } = Route.useParams();
  const navigate = useNavigate({ from: "/song-modal/$slug" });
  const clientSong = useSongBySlug(slug);
  const song = clientSong ?? loaderSong;
  const [isClosing, setIsClosing] = useState(false);

  const closeModal = () => {
    if (isClosing) return;
    setIsClosing(true);
    window.setTimeout(() => {
      void navigate({
        to: "/",
        search,
        replace: true,
        resetScroll: false,
      });
    }, 180);
  };

  return (
    <SongBrowser
      loaderSongs={songs}
      filterOptions={filterOptions}
      search={search}
      navigationTarget="/song-modal/$slug"
      navigationParams={{ slug }}
      modal={
        <div
          className={`fixed inset-0 z-50 bg-black/70 backdrop-blur-sm duration-200 ${
            isClosing ? "animate-out fade-out-0" : "animate-in fade-in-0"
          }`}
          onClick={closeModal}
        >
          <div
            className={`fixed left-1/2 top-1/2 z-[60] max-h-[85vh] w-[calc(100%-2rem)] max-w-lg -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-3xl border bg-background p-6 shadow-2xl duration-200 ${
              isClosing
                ? "animate-out zoom-out-95 slide-out-to-bottom-4 fade-out-0"
                : "animate-in zoom-in-95 slide-in-from-bottom-4"
            }`}
            onClick={(event) => event.stopPropagation()}
          >
            <button
              type="button"
              aria-label="Close song details"
              className="absolute right-4 top-4 rounded-full p-2 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
              onClick={closeModal}
            >
              <X className="h-4 w-4" />
            </button>

            <h2 className="sr-only">{song?.title ?? "Song details"}</h2>
            {song ? <SongDetail song={song} showFullPageLink={false} /> : <SongDetailSkeleton />}
          </div>
        </div>
      }
    />
  );
}

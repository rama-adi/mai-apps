import { createFileRoute, useNavigate } from "@tanstack/react-router";
import type { MaiDbSong } from "maidb-data";
import { useState } from "react";
import { SongBrowserModal } from "../../../components/song-browser/SongBrowserModal";
import {
  validateSongBrowserSearch,
  type SongBrowserSearchParams,
} from "../../../components/song-browser/song-browser.types";
import { getSongBySlug } from "../../-server/songs";

export const Route = createFileRoute("/(song-browser-songs)/songs/modal/$slug")({
  validateSearch: validateSongBrowserSearch,
  loader: async ({ params }) => getSongBySlug({ data: { slug: params.slug } }),
  component: SongsPageModalRoute,
});

function SongsPageModalRoute() {
  const song = Route.useLoaderData() as MaiDbSong | null;
  const search = Route.useSearch() as SongBrowserSearchParams;
  const navigate = useNavigate({ from: "/songs/modal/$slug" });
  const [isClosing, setIsClosing] = useState(false);

  const closeModal = () => {
    if (isClosing) return;
    setIsClosing(true);

    if (search.from && window.history.length > 1) {
      window.setTimeout(() => window.history.back(), 180);
      return;
    }

    window.setTimeout(() => {
      void navigate({
        to: "/songs",
        search: {
          q: search.q,
          category: search.category,
          version: search.version,
          difficulty: search.difficulty,
          type: search.type,
          region: search.region,
          minBpm: search.minBpm,
          maxBpm: search.maxBpm,
          minLevel: search.minLevel,
          maxLevel: search.maxLevel,
          isNew: search.isNew,
        },
        replace: true,
        resetScroll: false,
      });
    }, 180);
  };

  const navigateToSong = (slug: string) => {
    void navigate({
      to: "/songs/modal/$slug",
      params: { slug },
      search,
      replace: true,
      resetScroll: false,
      mask: {
        to: "/songs/$slug",
        params: { slug },
        unmaskOnReload: true,
      },
    });
  };

  return (
    <SongBrowserModal
      song={song}
      isClosing={isClosing}
      onClose={closeModal}
      onSongNavigate={navigateToSong}
    />
  );
}

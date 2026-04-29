import { createFileRoute, useNavigate } from "@tanstack/react-router";
import type { MaiDbSong } from "maidb-data";
import { useState } from "react";
import { SongBrowserModal } from "../../components/song-browser/SongBrowserModal";
import {
  validateSongBrowserSearch,
  type SongBrowserSearchParams,
} from "../../components/song-browser/song-browser.types";
import { getSongBySlug } from "../-server/songs";
import { SITE_URL } from "../../lib/site";

export const Route = createFileRoute("/(song-browser-home)/modal/$slug")({
  validateSearch: validateSongBrowserSearch,
  head: ({ params }) => ({
    meta: [{ name: "robots", content: "noindex,follow" }],
    links: [{ rel: "canonical", href: `${SITE_URL}/songs/${params.slug}` }],
  }),
  loader: async ({ params }) => getSongBySlug({ data: { slug: params.slug } }),
  component: HomeSongModalRoute,
});

function HomeSongModalRoute() {
  const song = Route.useLoaderData() as MaiDbSong | null;
  const search = Route.useSearch() as SongBrowserSearchParams;
  const navigate = useNavigate({ from: "/modal/$slug" });
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
        to: "/",
        replace: true,
        resetScroll: false,
      });
    }, 180);
  };

  const navigateToSong = (slug: string) => {
    void navigate({
      to: "/modal/$slug",
      params: { slug },
      search,
      replace: true,
      resetScroll: false,
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

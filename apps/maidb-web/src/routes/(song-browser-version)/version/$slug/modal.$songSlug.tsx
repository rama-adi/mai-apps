import { createFileRoute, useNavigate } from "@tanstack/react-router";
import type { MaiDbSong } from "maidb-data";
import { useState } from "react";
import { SongBrowserModal } from "../../../../components/song-browser/SongBrowserModal";
import {
  validateSongBrowserSearch,
  type SongBrowserSearchParams,
} from "../../../../components/song-browser/song-browser.types";
import { useSongBySlug } from "../../../../lib/use-songs";
import { getSongBySlug } from "../../../-server/songs";

export const Route = createFileRoute("/(song-browser-version)/version/$slug/modal/$songSlug")({
  validateSearch: validateSongBrowserSearch,
  loader: async ({ params }) => getSongBySlug({ data: { slug: params.songSlug } }),
  component: VersionPageModalRoute,
});

function VersionPageModalRoute() {
  const loaderSong = Route.useLoaderData() as MaiDbSong | null;
  const search = Route.useSearch() as SongBrowserSearchParams;
  const { slug, songSlug } = Route.useParams();
  const navigate = useNavigate({ from: "/version/$slug/modal/$songSlug" });
  const clientSong = useSongBySlug(songSlug);
  const song = clientSong ?? loaderSong;
  const [isClosing, setIsClosing] = useState(false);

  const closeModal = () => {
    if (isClosing) return;
    if (search.from && window.history.length > 1) {
      window.history.back();
      return;
    }

    setIsClosing(true);
    window.setTimeout(() => {
      void navigate({
        to: "/version/$slug",
        params: { slug },
        replace: true,
        resetScroll: false,
      });
    }, 180);
  };

  return <SongBrowserModal song={song} isClosing={isClosing} onClose={closeModal} />;
}

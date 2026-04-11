import { createFileRoute, useNavigate } from "@tanstack/react-router";
import type { MaiDbSong } from "maidb-data";
import { useState } from "react";
import { SongBrowserModal } from "../../../../components/song-browser/SongBrowserModal";
import {
  validateSongBrowserSearch,
  type SongBrowserSearchParams,
} from "../../../../components/song-browser/song-browser.types";
import { getSongBySlug } from "../../../-server/songs";

export const Route = createFileRoute("/(song-browser-version)/version/$slug/modal/$songSlug")({
  validateSearch: validateSongBrowserSearch,
  loader: async ({ params }) => getSongBySlug({ data: { slug: params.songSlug } }),
  component: VersionPageModalRoute,
});

function VersionPageModalRoute() {
  const song = Route.useLoaderData() as MaiDbSong | null;
  const search = Route.useSearch() as SongBrowserSearchParams;
  const { slug } = Route.useParams();
  const navigate = useNavigate({ from: "/version/$slug/modal/$songSlug" });
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
        to: "/version/$slug",
        params: { slug },
        replace: true,
        resetScroll: false,
      });
    }, 180);
  };

  return <SongBrowserModal song={song} isClosing={isClosing} onClose={closeModal} />;
}

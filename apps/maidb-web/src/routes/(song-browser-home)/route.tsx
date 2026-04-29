import { createFileRoute, Outlet, useMatches, useNavigate } from "@tanstack/react-router";
import type { MaiDbSong, Metadata } from "maidb-data";
import { getLatestSongs, getMetadata } from "../-server/index";
import { HomeContent } from "./-components/HomeContent";

export const Route = createFileRoute("/(song-browser-home)")({
  head: () => ({
    meta: [
      { title: "MaiDB - The Complete maimai Song Database" },
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
    const [latestSongs, metadata] = await Promise.all([getLatestSongs(), getMetadata()]);
    return { latestSongs, metadata };
  },
  component: HomeLayout,
});

function HomeLayout() {
  const { latestSongs, metadata } = Route.useLoaderData() as {
    latestSongs: MaiDbSong[];
    metadata: Metadata;
  };
  const navigate = useNavigate({ from: "/" });
  const matches = useMatches();
  const isModalActive = matches.some((m) => m.routeId === "/(song-browser-home)/modal/$slug");

  const openSongModal = (song: MaiDbSong) => {
    const from =
      typeof window !== "undefined"
        ? `${window.location.pathname}${window.location.search}${window.location.hash}`
        : "/";
    void navigate({
      to: "/modal/$slug",
      params: { slug: song.slug },
      search: { from },
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
    <>
      <div
        className={
          isModalActive
            ? "pointer-events-none select-none blur-sm transition-[filter] duration-200"
            : "transition-[filter] duration-200"
        }
        aria-hidden={isModalActive ? true : undefined}
      >
        <HomeContent latestSongs={latestSongs} metadata={metadata} onSongSelect={openSongModal} />
      </div>
      <Outlet />
    </>
  );
}

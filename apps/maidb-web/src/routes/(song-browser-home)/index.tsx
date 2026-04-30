import { createFileRoute, useNavigate } from "@tanstack/react-router";
import type { MaiDbSong, Metadata } from "maidb-data";
import { getLatestSongs, getMetadata } from "../-server/index";
import { HomeBanner } from "./-components/HomeBanner";
import { HomeCategories } from "./-components/HomeCategories";
import { HomeHero } from "./-components/HomeHero";
import { HomeNewest } from "./-components/HomeNewest";
import { HomeVersions } from "./-components/HomeVersions";

export const Route = createFileRoute("/(song-browser-home)/")({
  loader: async () => {
    const [latestSongs, metadata] = await Promise.all([getLatestSongs(), getMetadata()]);
    return { latestSongs, metadata };
  },
  component: HomeIndexRoute,
});

function HomeIndexRoute() {
  const { latestSongs, metadata } = Route.useLoaderData() as {
    latestSongs: MaiDbSong[];
    metadata: Metadata;
  };
  const navigate = useNavigate({ from: "/" });
  const featuredSongs = latestSongs.slice(0, 12);

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
      <HomeHero />
      <div className="mx-auto max-w-5xl px-4 pb-20" data-song-browser-surface="">
        <HomeNewest songs={featuredSongs} onSongSelect={openSongModal} />
        <HomeCategories categories={metadata.categories} />
        <HomeVersions versions={metadata.versions} />
        <HomeBanner />
      </div>
    </>
  );
}

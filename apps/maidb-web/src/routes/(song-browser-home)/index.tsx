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
        <div className="grid grid-cols-1 gap-10 lg:grid-cols-[minmax(0,1fr)_18rem] lg:gap-12">
          <main className="min-w-0">
            <HomeNewest songs={featuredSongs} onSongSelect={openSongModal} />
            <HomeCategories categories={metadata.categories} />
          </main>

          <aside className="lg:sticky lg:top-24 lg:self-start">
            <div className="mt-14">
              <p className="mb-3 text-[10px] font-bold uppercase tracking-[0.32em] text-muted-foreground">
                Versions
              </p>
              <HomeVersions versions={metadata.versions} compact />
            </div>
          </aside>
        </div>

        <HomeBanner />
      </div>
    </>
  );
}

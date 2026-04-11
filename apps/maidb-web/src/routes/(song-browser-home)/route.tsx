import { createFileRoute, Link, Outlet, useNavigate } from "@tanstack/react-router";
import type { MaiDbSong, Metadata } from "maidb-data";
import { ArrowRight, Search, Sparkles } from "lucide-react";
import { SongBrowser } from "../../components/song-browser/SongBrowser";
import { SongBrowserGridView } from "../../components/song-browser/SongBrowserGridView";
import { getLatestSongs, getMetadata } from "../-server/index";

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
  component: HomePage,
});

function HomePage() {
  const { latestSongs, metadata } = Route.useLoaderData() as {
    latestSongs: MaiDbSong[];
    metadata: Metadata;
  };
  const navigate = useNavigate({ from: "/" });
  const featuredSongs = latestSongs.slice(0, 12);

  const catColors = metadata.categories.map((c) => c.color);

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
      {/* Full-bleed hero */}
      <section className="relative -mt-8 overflow-hidden border-b">
        {/* Animated gradient mesh background */}
        <div className="absolute inset-0">
          <div
            className="absolute -left-1/4 -top-1/2 h-[600px] w-[600px] rounded-full opacity-[0.07] blur-3xl"
            style={{ backgroundColor: catColors[0] }}
          />
          <div
            className="absolute -right-1/4 -top-1/3 h-[500px] w-[500px] rounded-full opacity-[0.06] blur-3xl"
            style={{ backgroundColor: catColors[5] }}
          />
          <div
            className="absolute -bottom-1/3 left-1/3 h-[400px] w-[400px] rounded-full opacity-[0.05] blur-3xl"
            style={{ backgroundColor: catColors[3] }}
          />
        </div>

        <div className="relative mx-auto max-w-5xl px-4 pb-14 pt-16 sm:pb-20 sm:pt-24">
          <p className="mb-4 text-[10px] font-bold uppercase tracking-[0.3em] text-primary">
            maimai Song Database
          </p>

          <h1 className="m-0 max-w-2xl text-4xl font-black leading-[1.05] tracking-tight text-foreground sm:text-6xl">
            Every chart,
            <br />
            <span className="bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
              every song.
            </span>
          </h1>

          <p className="mt-4 max-w-md text-base text-muted-foreground sm:text-lg">
            The complete maimai catalog — charts, difficulty levels, BPM, and version history.
          </p>

          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Link
              to="/songs"
              className="group inline-flex items-center gap-2 rounded-lg bg-primary px-6 py-3 text-sm font-bold text-primary-foreground shadow-lg shadow-primary/20 transition-all hover:bg-primary/90 hover:shadow-xl hover:shadow-primary/25"
            >
              <Search className="h-4 w-4" />
              Browse all songs
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </Link>
            <span className="text-sm tabular-nums text-muted-foreground">
              {latestSongs.length > 0 &&
                `${metadata.versions.length} versions · ${metadata.categories.length} categories`}
            </span>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-5xl px-4 pb-16" data-song-browser-surface="">
        {/* Newest Songs */}
        <section className="mt-12">
          <div className="mb-5 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <Sparkles className="h-5 w-5 text-primary" />
              <h2 className="m-0 text-lg font-black uppercase tracking-wide text-foreground">
                Newest Songs
              </h2>
            </div>
            <Link
              to="/songs"
              search={{ isNew: true }}
              className="group flex items-center gap-1 text-sm font-semibold text-primary hover:underline"
            >
              View all
              <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
            </Link>
          </div>

          <SongBrowser initialSongs={featuredSongs} paginationMode="all">
            <SongBrowserGridView onSongSelect={openSongModal} />
          </SongBrowser>
        </section>

        {/* Categories */}
        <section className="mt-12">
          <h2 className="m-0 mb-5 text-lg font-black uppercase tracking-wide text-foreground">
            Categories
          </h2>

          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {metadata.categories.map((cat) => (
              <Link
                key={cat.slug}
                to="/songs"
                search={{ category: cat.slug }}
                className="group relative flex items-center gap-3 overflow-hidden rounded-lg border bg-card p-4 transition-all hover:shadow-md"
                style={{
                  borderColor: `color-mix(in oklch, ${cat.color} 25%, transparent)`,
                }}
              >
                {/* Color accent */}
                <div
                  className="absolute inset-0 opacity-0 transition-opacity group-hover:opacity-100"
                  style={{
                    background: `linear-gradient(135deg, color-mix(in oklch, ${cat.color} 6%, transparent), transparent)`,
                  }}
                />
                <div
                  className="relative flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg"
                  style={{ backgroundColor: `color-mix(in oklch, ${cat.color} 15%, transparent)` }}
                >
                  <div
                    className="h-2.5 w-2.5 rounded-full"
                    style={{ backgroundColor: cat.color }}
                  />
                </div>
                <span className="relative text-sm font-bold text-card-foreground">
                  {cat.category}
                </span>
                <ArrowRight className="relative ml-auto h-4 w-4 text-muted-foreground opacity-0 transition-all group-hover:translate-x-0.5 group-hover:opacity-100" />
              </Link>
            ))}
          </div>
        </section>

        {/* Versions — timeline style */}
        <section className="mt-12">
          <h2 className="m-0 mb-5 text-lg font-black uppercase tracking-wide text-foreground">
            Versions
          </h2>

          <div className="grid gap-1.5 sm:grid-cols-2 lg:grid-cols-3">
            {[...metadata.versions].reverse().map((ver, i) => (
              <Link
                key={ver.slug}
                to="/version/$slug"
                params={{ slug: ver.slug }}
                className="group flex items-center gap-3 rounded-lg border bg-card px-4 py-2.5 transition-all hover:bg-accent/50 hover:shadow-sm"
              >
                <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-primary/10 text-[9px] font-black text-primary">
                  {metadata.versions.length - i}
                </span>
                <div className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-bold text-card-foreground">
                    {ver.abbr}
                  </span>
                </div>
                <span className="flex-shrink-0 text-[11px] tabular-nums text-muted-foreground">
                  {ver.releaseDate}
                </span>
              </Link>
            ))}
          </div>
        </section>
      </div>
      <Outlet />
    </>
  );
}

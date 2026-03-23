import { createFileRoute, Link } from "@tanstack/react-router";
import type { MaiDbSong, Metadata } from "maidb-data";
import { ArrowRight, Music, Search, Disc3, Layers, Sparkles } from "lucide-react";
import { SongCard } from "../components/SongCard";
import { getLatestSongs, getMetadata } from "./-server/index";

export const Route = createFileRoute("/")({
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

  return (
    <main className="mx-auto max-w-5xl flex-1 px-4 pb-12 pt-8">
      {/* Hero */}
      <section className="rounded-xl border bg-card p-8 sm:p-12">
        <div className="mb-4 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
            <Music className="h-5 w-5 text-primary" />
          </div>
          <span className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            maimai Song Database
          </span>
        </div>

        <h1 className="mb-3 text-3xl font-bold tracking-tight text-foreground sm:text-5xl">
          Every chart, every song.
        </h1>
        <p className="mb-6 max-w-2xl text-base text-muted-foreground sm:text-lg">
          Browse the complete maimai song catalog. Explore charts, difficulty levels, BPM, and
          version history — all in one place.
        </p>

        <Link
          to="/songs"
          className="inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
        >
          <Search className="h-4 w-4" />
          Browse all songs
          <ArrowRight className="h-4 w-4" />
        </Link>
      </section>

      {/* Newest Songs */}
      <section className="mt-10">
        <div className="mb-5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            <h2 className="m-0 text-xl font-bold text-foreground">Newest Songs</h2>
          </div>
          <Link
            to="/songs"
            search={{ isNew: true }}
            className="flex items-center gap-1 text-sm font-medium text-primary hover:underline"
          >
            View all new
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {latestSongs.slice(0, 12).map((song) => (
            <SongCard key={song.songId} song={song} />
          ))}
        </div>
      </section>

      {/* Categories */}
      <section className="mt-10">
        <div className="mb-5 flex items-center gap-2">
          <Layers className="h-5 w-5 text-primary" />
          <h2 className="m-0 text-xl font-bold text-foreground">Categories</h2>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {metadata.categories.map((cat) => (
            <Link
              key={cat.slug}
              to="/songs"
              search={{ category: cat.slug }}
              className="group flex items-center gap-3 rounded-lg border bg-card p-4 transition-colors hover:bg-accent/50"
            >
              <div
                className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg"
                style={{ backgroundColor: `${cat.color}20` }}
              >
                <div className="h-3 w-3 rounded-full" style={{ backgroundColor: cat.color }} />
              </div>
              <span className="text-sm font-semibold text-card-foreground group-hover:text-foreground">
                {cat.category}
              </span>
              <ArrowRight className="ml-auto h-4 w-4 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
            </Link>
          ))}
        </div>
      </section>

      {/* Versions */}
      <section className="mt-10">
        <div className="mb-5 flex items-center gap-2">
          <Disc3 className="h-5 w-5 text-primary" />
          <h2 className="m-0 text-xl font-bold text-foreground">Versions</h2>
        </div>

        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {[...metadata.versions].reverse().map((ver) => (
            <Link
              key={ver.slug}
              to="/songs"
              search={{ version: ver.slug }}
              className="group flex items-center justify-between rounded-lg border bg-card px-4 py-3 transition-colors hover:bg-accent/50"
            >
              <div className="min-w-0">
                <span className="block truncate text-sm font-semibold text-card-foreground group-hover:text-foreground">
                  {ver.abbr}
                </span>
                <span className="text-xs text-muted-foreground">{ver.releaseDate}</span>
              </div>
              <ArrowRight className="ml-3 h-4 w-4 flex-shrink-0 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
            </Link>
          ))}
        </div>
      </section>
    </main>
  );
}

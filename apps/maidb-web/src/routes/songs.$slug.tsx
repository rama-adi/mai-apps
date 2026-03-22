import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "convex/react";
import { api } from "@packages/backend/convex/_generated/api";
import { getSongBySlug } from "./songs.$slug.functions";
import { SongDetail, SongDetailSkeleton } from "../components/SongDetail";
import { ArrowLeft } from "lucide-react";

export const Route = createFileRoute("/songs/$slug")({
  head: ({ loaderData }) => {
    const song = loaderData as unknown as { title: string; artist: string } | null;
    if (!song) return { meta: [{ title: "Song Not Found - MaiDB" }] };
    return {
      meta: [
        { title: `${song.title} - MaiDB` },
        {
          name: "description",
          content: `${song.title} by ${song.artist}. View charts, difficulty levels, and more on MaiDB.`,
        },
        { property: "og:title", content: `${song.title} - MaiDB` },
        {
          property: "og:description",
          content: `${song.title} by ${song.artist} — charts, BPM, version history on MaiDB.`,
        },
      ],
    };
  },
  loader: async ({ params }) => {
    return getSongBySlug(params.slug);
  },
  component: SongPage,
});

function SongPage() {
  const loaderSong = Route.useLoaderData();
  const { slug } = Route.useParams();

  const liveSong = useQuery(api.songs.getSongBySlug, { slug });
  const song = liveSong ?? loaderSong;

  return (
    <main className="mx-auto max-w-3xl flex-1 px-4 pb-12 pt-8">
      <Link
        to="/"
        className="mb-6 inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to songs
      </Link>

      <div className="rounded-xl border bg-card p-6 sm:p-8">
        {song ? <SongDetail song={song} showFullPageLink={false} /> : <SongDetailSkeleton />}
      </div>
    </main>
  );
}

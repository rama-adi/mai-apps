import { createFileRoute, Link } from "@tanstack/react-router";
import type { MaiDbSong } from "maidb-data";
import { DIFFICULTY_NAMES, TYPE_NAMES } from "maidb-data";
import { getSongBySlug } from "../-server/songs";
import { SongWikiPage, SongWikiPageSkeleton } from "../../components/song-detail/SongWikiPage";
import { useSongBySlug } from "../../lib/use-songs";
import { ArrowLeft } from "lucide-react";

const SITE_URL = "https://maidb.onebyteworks.my.id";
const OG_IMAGE_BASE = "https://maisongdb-blob.onebyteworks.my.id/og-v1";

function buildSongSeoDescription(song: MaiDbSong): string {
  const difficulties = song.sheets
    .map((s) => `${DIFFICULTY_NAMES[s.difficulty] ?? s.difficulty} ${s.level}`)
    .join(", ");
  const chartTypes = [...new Set(song.sheets.map((s) => TYPE_NAMES[s.type] ?? s.type))].join(" & ");
  const regions = [
    ...new Set(
      song.sheets.flatMap((s) =>
        Object.entries(s.regions)
          .filter(([, v]) => v)
          .map(([k]) => k.toUpperCase()),
      ),
    ),
  ].join("/");

  return `${song.title} by ${song.artist} — ${chartTypes} charts for maimai. BPM: ${song.bpm}. Difficulties: ${difficulties}. Version: ${song.version}. Category: ${song.category}. Available in: ${regions}.${song.releaseDate ? ` Released: ${song.releaseDate}.` : ""}`;
}

function buildJsonLd(song: MaiDbSong) {
  const imageUrl = song.internalImageId
    ? `${OG_IMAGE_BASE}/${song.internalImageId}.jpg`
    : undefined;

  return {
    "@context": "https://schema.org",
    "@type": "MusicComposition",
    name: song.title,
    composer: { "@type": "Person", name: song.artist },
    ...(imageUrl ? { image: imageUrl } : {}),
    identifier: song.songId,
    datePublished: song.releaseDate || undefined,
    genre: song.category,
    url: `${SITE_URL}/songs/${song.slug}`,
    additionalProperty: [
      { "@type": "PropertyValue", name: "BPM", value: String(song.bpm) },
      { "@type": "PropertyValue", name: "Version", value: song.version },
      {
        "@type": "PropertyValue",
        name: "Chart Types",
        value: [...new Set(song.sheets.map((s) => TYPE_NAMES[s.type] ?? s.type))].join(", "),
      },
      ...song.sheets.map((s) => ({
        "@type": "PropertyValue",
        name: `${TYPE_NAMES[s.type] ?? s.type} ${DIFFICULTY_NAMES[s.difficulty] ?? s.difficulty}`,
        value: s.internalLevelValue > 0 ? String(s.internalLevelValue) : s.level,
      })),
    ],
  };
}

export const Route = createFileRoute("/songs/$slug")({
  head: ({ loaderData }) => {
    const song = loaderData as unknown as MaiDbSong | null;
    if (!song) {
      return {
        meta: [{ title: "Song Not Found - MaiDB" }, { name: "robots", content: "noindex" }],
      };
    }

    const description = buildSongSeoDescription(song);
    const canonicalUrl = `${SITE_URL}/songs/${song.slug}`;
    const imageUrl = song.internalImageId
      ? `${OG_IMAGE_BASE}/${song.internalImageId}.jpg`
      : undefined;
    const title = `${song.title} by ${song.artist} - maimai Chart Database | MaiDB`;

    return {
      meta: [
        { title },
        { name: "description", content: description },

        // Open Graph
        { property: "og:type", content: "music.song" },
        { property: "og:title", content: title },
        { property: "og:description", content: description },
        { property: "og:url", content: canonicalUrl },
        { property: "og:site_name", content: "MaiDB" },
        ...(imageUrl
          ? [
              { property: "og:image", content: imageUrl },
              { property: "og:image:width", content: "200" },
              { property: "og:image:height", content: "200" },
              { property: "og:image:alt", content: `${song.title} album art` },
            ]
          : []),
        { property: "music:musician", content: song.artist },

        // Twitter Card
        { name: "twitter:card", content: "summary" },
        { name: "twitter:title", content: title },
        { name: "twitter:description", content: description },
        ...(imageUrl ? [{ name: "twitter:image", content: imageUrl }] : []),

        // Additional SEO
        {
          name: "keywords",
          content: [
            song.title,
            song.artist,
            "maimai",
            "chart",
            song.category,
            song.version,
            ...song.sheets.map((s) => DIFFICULTY_NAMES[s.difficulty] ?? s.difficulty),
            ...song.sheets.map((s) => `level ${s.level}`),
            "rhythm game",
            "arcade",
            "SEGA",
          ].join(", "),
        },
      ],
      links: [{ rel: "canonical", href: canonicalUrl }],
      scripts: [
        {
          type: "application/ld+json",
          children: JSON.stringify(buildJsonLd(song)),
        },
      ],
    };
  },
  loader: async ({ params }) => {
    return getSongBySlug({ data: { slug: params.slug } });
  },
  component: SongPage,
});

function SongPage() {
  const loaderSong = Route.useLoaderData();
  const { slug } = Route.useParams();

  const clientSong = useSongBySlug(slug);
  const song = clientSong ?? loaderSong;

  return (
    <main className="mx-auto w-full max-w-5xl flex-1 px-4 pb-16 pt-8">
      <Link
        to="/"
        className="mb-6 inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to songs
      </Link>

      {song ? <SongWikiPage song={song} /> : <SongWikiPageSkeleton />}
    </main>
  );
}

import { createFileRoute, Link } from "@tanstack/react-router";
import type { MaiDbSong } from "maidb-data";
import { CATEGORY_BY_SLUG, DIFFICULTY_NAMES, TYPE_NAMES, VERSION_BY_SLUG } from "maidb-data";
import { useMemo } from "react";
import { getSongBySlug } from "./-server/songs";
import { SongWikiPage, SongWikiPageSkeleton } from "../components/song-detail/SongWikiPage";
import { useSongBySlug } from "../lib/use-songs";
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

  const versionName = VERSION_BY_SLUG[song.version]?.version ?? song.version;
  const categoryName = CATEGORY_BY_SLUG[song.category]?.category ?? song.category;
  return `${song.title} by ${song.artist} — ${chartTypes} charts for maimai. BPM: ${song.bpm}. Difficulties: ${difficulties}. Version: ${versionName}. Category: ${categoryName}. Available in: ${regions}.${song.releaseDate ? ` Released: ${song.releaseDate}.` : ""}`;
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
    genre: CATEGORY_BY_SLUG[song.category]?.category ?? song.category,
    url: `${SITE_URL}/songs/${song.slug}`,
    additionalProperty: [
      { "@type": "PropertyValue", name: "BPM", value: String(song.bpm) },
      {
        "@type": "PropertyValue",
        name: "Version",
        value: VERSION_BY_SLUG[song.version]?.version ?? song.version,
      },
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

export const Route = createFileRoute("/songs_/$slug")({
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
            CATEGORY_BY_SLUG[song.category]?.category ?? song.category,
            VERSION_BY_SLUG[song.version]?.version ?? song.version,
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
  const catColor = useMemo(
    () => (song ? (CATEGORY_BY_SLUG[song.category]?.color ?? "#888") : null),
    [song],
  );

  return (
    <>
      {/* Full-width gradient that bleeds behind the navbar */}
      {catColor && (
        <div
          className="pointer-events-none fixed inset-x-0 top-0 z-0 h-72"
          style={{
            background: `linear-gradient(to bottom, color-mix(in oklch, ${catColor} 10%, transparent), transparent)`,
          }}
        />
      )}
      <main className="relative z-0 mx-auto w-full max-w-5xl flex-1 px-4 pb-16 pt-6">
        <Link
          to="/songs"
          className="mb-5 inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          All songs
        </Link>

        {song ? <SongWikiPage song={song} /> : <SongWikiPageSkeleton />}
      </main>
    </>
  );
}

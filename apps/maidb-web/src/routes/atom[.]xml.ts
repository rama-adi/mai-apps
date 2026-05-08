import { createFileRoute } from "@tanstack/react-router";
import { getMetadata, loadSongList } from "../lib/song-data.server";
import { SITE_NAME, SITE_URL } from "../lib/site";
import { buildAtomFeed, xmlResponse, type AtomEntry } from "../lib/sitemap";

function toIsoDate(value: string | undefined, fallback: string): string {
  if (!value) return fallback;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? fallback : parsed.toISOString();
}

const GET = async () => {
  const [{ songs }, metadata] = await Promise.all([loadSongList(), getMetadata()]);
  const now = new Date().toISOString();
  const entries: AtomEntry[] = [];

  const metaPages: { path: string; title: string }[] = [
    { path: "/", title: `${SITE_NAME} — Home` },
    { path: "/songs", title: "Songs" },
    { path: "/about", title: "About" },
  ];
  for (const page of metaPages) {
    const link = `${SITE_URL}${page.path}`;
    entries.push({ id: link, title: page.title, link, updated: now });
  }

  for (const song of songs) {
    const link = `${SITE_URL}/songs/${song.slug}`;
    entries.push({
      id: link,
      title: `${song.title} — ${song.artist}`,
      link,
      updated: toIsoDate(song.releaseDate, now),
    });
  }

  for (const version of metadata.versions) {
    const link = `${SITE_URL}/version/${version.slug}`;
    entries.push({
      id: link,
      title: `Version: ${version.version}`,
      link,
      updated: toIsoDate(version.releaseDate, now),
    });
  }

  for (const category of metadata.categories) {
    const link = `${SITE_URL}/version/${category.slug}`;
    entries.push({
      id: link,
      title: `Category: ${category.category}`,
      link,
      updated: now,
    });
  }

  return xmlResponse(
    buildAtomFeed({
      id: `${SITE_URL}/atom.xml`,
      title: `${SITE_NAME} Feed`,
      selfLink: `${SITE_URL}/atom.xml`,
      updated: now,
      entries,
    }),
  );
};

export const Route = createFileRoute("/atom.xml")({
  server: {
    handlers: {
      GET,
      HEAD: GET,
    },
  },
});

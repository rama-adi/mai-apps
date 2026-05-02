import { createFileRoute, Outlet, useNavigate, useRouter } from "@tanstack/react-router";
import {
  VERSION_BY_SLUG,
  VERSIONS,
  type MaiDbSong,
  type Metadata,
  type OpenSeoEntry,
} from "maidb-data";
import { useMemo } from "react";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { SongCard, SongCardSkeleton } from "../../../../components/SongCard";
import { SongBrowser } from "../../../../components/song-browser/SongBrowser";
import { SongBrowserResults } from "../../../../components/song-browser/SongBrowserResults";
import { getVersionPageData } from "../../../-server/version";
import { OG_IMAGE_LOCAL_BASE, SITE_LOCALE, SITE_NAME, SITE_URL } from "../../../../lib/site";

type WeekGroup = {
  key: string;
  label: string;
  songs: MaiDbSong[];
};

export const Route = createFileRoute("/(song-browser-version)/version/$slug")({
  head: ({ loaderData, params }) => {
    const data = loaderData as
      | {
          songs: MaiDbSong[];
          version: Metadata["versions"][number] | null;
          openSeo: OpenSeoEntry | null;
        }
      | undefined;
    const version = data?.version;
    const displayName = version?.version ?? VERSION_BY_SLUG[params.slug]?.version ?? params.slug;
    const title = `${displayName} - MaiDB`;
    const description = `Songs added in ${displayName}.`;
    const canonicalUrl = `${SITE_URL}/version/${params.slug}`;
    const ogImage = `${OG_IMAGE_LOCAL_BASE}/version-${params.slug}.jpg`;

    return {
      meta: [
        { title },
        { name: "description", content: description },

        { property: "og:type", content: "website" },
        { property: "og:title", content: title },
        { property: "og:description", content: description },
        { property: "og:url", content: canonicalUrl },
        { property: "og:site_name", content: SITE_NAME },
        { property: "og:locale", content: SITE_LOCALE },
        { property: "og:image", content: ogImage },
        { property: "og:image:alt", content: `${displayName} version on MaiDB` },

        { name: "twitter:card", content: "summary_large_image" },
        { name: "twitter:title", content: title },
        { name: "twitter:description", content: description },
        { name: "twitter:image", content: ogImage },
      ],
      links: [{ rel: "canonical", href: canonicalUrl }],
    };
  },
  loader: async ({ params }) => getVersionPageData({ data: { slug: params.slug } }),
  component: VersionPage,
});

function VersionPage() {
  const {
    songs: loaderSongs,
    version,
    openSeo,
  } = Route.useLoaderData() as {
    songs: MaiDbSong[];
    version: Metadata["versions"][number] | null;
    openSeo: OpenSeoEntry | null;
  };
  const { slug } = Route.useParams();
  const navigate = useNavigate({ from: "/version/$slug" });
  const router = useRouter();
  const displayName = version?.version ?? VERSION_BY_SLUG[slug]?.version ?? slug;
  const displayAbbr = version?.abbr ?? VERSION_BY_SLUG[slug]?.abbr ?? slug;
  const releaseDate = version?.releaseDate ?? VERSION_BY_SLUG[slug]?.releaseDate;
  const accent = useMemo(() => versionAccent(slug), [slug]);

  const openSongModal = (song: MaiDbSong) => {
    const from =
      typeof window !== "undefined"
        ? `${window.location.pathname}${window.location.search}${window.location.hash}`
        : `/version/${slug}`;
    void navigate({
      to: "/version/$slug/modal/$songSlug",
      params: { slug, songSlug: song.slug },
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
        className="pointer-events-none fixed inset-x-0 top-0 z-0 h-72"
        style={{
          background: `linear-gradient(to bottom, color-mix(in oklch, ${accent} 12%, transparent), transparent)`,
        }}
      />
      <main
        className="relative z-0 mx-auto w-full max-w-3xl px-4 pb-16 pt-6"
        data-song-browser-surface=""
      >
        <button
          type="button"
          onClick={() => router.history.back()}
          className="mb-8 inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back
        </button>

        <header className="mb-10">
          <p
            className="text-[10px] font-bold uppercase tracking-[0.32em]"
            style={{ color: accent }}
          >
            maimai version
          </p>
          <h1 className="mt-2 text-4xl font-black tracking-tight text-foreground sm:text-5xl">
            {displayName}
          </h1>
          <p className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground">
            <span className="font-mono">{displayAbbr}</span>
            {releaseDate && (
              <>
                <span aria-hidden>·</span>
                <span className="tabular-nums">{releaseDate}</span>
              </>
            )}
            <span aria-hidden>·</span>
            <button
              type="button"
              onClick={() =>
                void navigate({
                  to: "/songs",
                  search: { version: slug },
                })
              }
              className="group inline-flex cursor-pointer items-center gap-1 font-semibold underline decoration-dotted underline-offset-4 transition-colors hover:decoration-solid"
              style={{ color: accent }}
            >
              Filter based on this
              <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
            </button>
          </p>
        </header>

        {openSeo?.content?.trim() ? (
          <article className="mb-12 text-justify text-base leading-relaxed text-foreground/90 hyphens-auto">
            <p className="m-0">
              {openSeo.content
                .replace(/\s+$/, "")
                .split("\n")
                .map((line, index, arr) => (
                  <span key={index}>
                    {line}
                    {index < arr.length - 1 && <br />}
                  </span>
                ))}
            </p>
          </article>
        ) : null}

        <SongBrowser
          initialSongs={loaderSongs}
          paginationMode="all"
          resolveHydratedSongs={(all) => all.filter((song) => song.version === slug)}
        >
          <SongBrowserResults>
            {({ isLoading, songs, totalCount }) => {
              const weeks = songs ? groupSongsByWeek(songs) : [];

              return (
                <section>
                  <div className="mb-6 flex items-baseline justify-between gap-3">
                    <h2 className="m-0 text-xl font-black tracking-tight text-foreground">Songs</h2>
                    <span className="text-xs tabular-nums text-muted-foreground">
                      {isLoading ? "Loading..." : `${totalCount ?? 0} total`}
                    </span>
                  </div>

                  {isLoading && (
                    <div className="space-y-8">
                      {Array.from({ length: 2 }).map((_, sectionIndex) => (
                        <div key={sectionIndex} className="space-y-3">
                          <div className="h-4 w-56 animate-pulse rounded bg-muted" />
                          <div className="grid gap-3 sm:grid-cols-2">
                            {Array.from({ length: 4 }).map((__, cardIndex) => (
                              <SongCardSkeleton key={cardIndex} />
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {!isLoading && (
                    <div className="space-y-10">
                      {weeks.map((week) => (
                        <div key={week.key}>
                          <h3
                            className="mb-3 text-xs font-bold uppercase tracking-[0.18em] text-muted-foreground"
                            style={{
                              borderLeft: `2px solid ${accent}`,
                              paddingLeft: "0.625rem",
                            }}
                          >
                            {week.label}
                          </h3>
                          <div className="grid gap-3 sm:grid-cols-2">
                            {week.songs.map((song) => (
                              <SongCard key={song.songId} song={song} onSelect={openSongModal} />
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </section>
              );
            }}
          </SongBrowserResults>
        </SongBrowser>

        <Outlet />
      </main>
    </>
  );
}

const VERSION_PALETTE = [
  "#f64849",
  "#ff7e36",
  "#3aa64f",
  "#22bb5b",
  "#fb9c2d",
  "#ffb74d",
  "#ec4899",
  "#f472b6",
  "#9e45e2",
  "#ba67f8",
  "#94a3b8",
  "#cbd5e1",
  "#eab308",
  "#a855f7",
  "#ef4444",
  "#06b6d4",
  "#0ea5e9",
  "#3583fe",
  "#6366f1",
  "#dc2626",
  "#f97316",
  "#fb923c",
  "#dc39b8",
  "#a855f7",
  "#14b8a6",
  "#0ea5e9",
];

function versionAccent(slug: string): string {
  const index = VERSIONS.findIndex((v) => v.slug === slug);
  if (index < 0) return "#3583fe";
  return VERSION_PALETTE[index % VERSION_PALETTE.length] ?? "#3583fe";
}

function groupSongsByWeek(songs: MaiDbSong[]): WeekGroup[] {
  const groups = new Map<string, { label: string; songs: MaiDbSong[] }>();

  for (const song of songs) {
    const { key, label } = getWeekKeyAndLabel(song.releaseDate);
    const existing = groups.get(key);
    if (existing) {
      existing.songs.push(song);
    } else {
      groups.set(key, { label, songs: [song] });
    }
  }

  return [...groups.entries()]
    .sort(([a], [b]) => {
      if (a === UNKNOWN_WEEK_KEY) return 1;
      if (b === UNKNOWN_WEEK_KEY) return -1;
      return b.localeCompare(a);
    })
    .map(([key, value]) => ({
      key,
      label: value.label,
      songs: value.songs,
    }));
}

const UNKNOWN_WEEK_KEY = "__unknown__";
const UNKNOWN_WEEK_LABEL = "Unknown release date";

function getWeekKeyAndLabel(input: string | null | undefined): { key: string; label: string } {
  if (!input) return { key: UNKNOWN_WEEK_KEY, label: UNKNOWN_WEEK_LABEL };
  const date = new Date(`${input}T00:00:00Z`);
  if (Number.isNaN(date.getTime())) return { key: UNKNOWN_WEEK_KEY, label: UNKNOWN_WEEK_LABEL };
  const day = date.getUTCDay();
  const mondayOffset = (day + 6) % 7;
  const start = new Date(date);
  start.setUTCDate(date.getUTCDate() - mondayOffset);
  const end = new Date(start);
  end.setUTCDate(start.getUTCDate() + 6);

  return {
    key: start.toISOString().slice(0, 10),
    label: `${formatWeekDate(start)} – ${formatWeekDate(end)}`,
  };
}

function formatWeekDate(date: Date): string {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  }).format(date);
}

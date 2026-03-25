import { createFileRoute, Link } from "@tanstack/react-router";
import type { MaiDbSong, Sheet } from "maidb-data";
import {
  CATEGORY_BY_SLUG,
  DIFFICULTY_COLORS,
  DIFFICULTY_NAMES,
  REGION_LABELS,
  TYPE_NAMES,
  VERSION_BY_SLUG,
} from "maidb-data";
import { useMemo, useState } from "react";
import { getSongBySlug } from "./-server/songs";
import { useSongBySlug } from "../lib/use-songs";
import {
  ArrowLeft,
  Check,
  ClipboardCheck,
  Clock,
  Lock,
  Share2,
  X,
  Youtube,
  Zap,
} from "lucide-react";
import { SongImage } from "../components/song-detail/shared";

const SITE_URL = "https://maidb.onebyteworks.my.id";
const OG_IMAGE_BASE = "https://maisongdb-blob.onebyteworks.my.id/og-v1";
const REGION_KEYS = ["jp", "intl", "usa", "cn"] as const;

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

function youtubeSearchUrl(query: string) {
  return `https://www.youtube.com/results?search_query=${encodeURIComponent(query).replace(/%20/g, "+")}`;
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

        {song ? <SongWikiContent song={song} /> : <SongWikiPageSkeleton />}
      </main>
    </>
  );
}

function SongWikiContent({ song }: { song: MaiDbSong }) {
  const chartTypes = [...new Set(song.sheets.map((s) => s.type))];
  const catMeta = CATEGORY_BY_SLUG[song.category];
  const catColor = catMeta?.color ?? "#888";
  const verMeta = VERSION_BY_SLUG[song.version];

  const nonUtageSheets = song.sheets.filter((s) => s.type !== "utage");
  const utageSheets = song.sheets.filter((s) => s.type === "utage");
  const sheetsByType = groupSheetsByType(nonUtageSheets);

  const regions = { jp: false, intl: false, usa: false, cn: false };
  for (const sheet of song.sheets) {
    for (const key of Object.keys(regions) as (keyof typeof regions)[]) {
      if (sheet.regions[key]) regions[key] = true;
    }
  }

  return (
    <div className="space-y-8">
      <div className="grid gap-8 lg:grid-cols-[16rem_minmax(0,1fr)] lg:items-start">
        <aside className="lg:sticky lg:top-24">
          <div
            className="overflow-hidden rounded-xl border bg-card"
            style={{ borderColor: `color-mix(in oklch, ${catColor} 25%, transparent)` }}
          >
            <div
              className="flex items-center justify-center p-4"
              style={{
                background: `linear-gradient(to bottom, color-mix(in oklch, ${catColor} 8%, transparent), transparent)`,
              }}
            >
              <SongImage song={song} size="lg" />
            </div>
            <div className="divide-y text-sm">
              <InfoboxRow label="BPM">
                <span className="inline-flex items-center gap-1 font-bold text-foreground">
                  <Zap className="h-3 w-3 text-primary" />
                  {song.bpm}
                </span>
              </InfoboxRow>
              <InfoboxRow label="Version">
                <span className="font-semibold text-foreground">
                  {verMeta?.abbr ?? song.version}
                </span>
              </InfoboxRow>
              <InfoboxRow label="Chart Type">
                <span className="font-medium">
                  {chartTypes.map((t) => TYPE_NAMES[t] ?? t).join(", ")}
                </span>
              </InfoboxRow>
              {song.releaseDate && (
                <InfoboxRow label="Release">
                  <span className="inline-flex items-center gap-1 tabular-nums">
                    <Clock className="h-3 w-3" />
                    {song.releaseDate}
                  </span>
                </InfoboxRow>
              )}
              <InfoboxRow label="Regions">
                <div className="flex flex-wrap justify-end gap-1">
                  {(Object.entries(regions) as [string, boolean][]).map(([key, available]) => (
                    <span
                      key={key}
                      className={`rounded px-1.5 py-0.5 text-[10px] font-bold ${
                        available
                          ? "bg-primary/10 text-primary"
                          : "bg-muted text-muted-foreground/40 line-through"
                      }`}
                    >
                      {REGION_LABELS[key] ?? key}
                    </span>
                  ))}
                </div>
              </InfoboxRow>
            </div>
          </div>
        </aside>

        <div className="min-w-0 space-y-8">
          <section>
            <div className="mb-2 flex items-center gap-2">
              <span
                className="rounded px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white"
                style={{ backgroundColor: catColor }}
              >
                {catMeta?.category ?? song.category}
              </span>
              {song.isNew && (
                <span className="rounded bg-primary px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-primary-foreground">
                  New
                </span>
              )}
              {song.isLocked && (
                <span className="inline-flex items-center gap-1 rounded bg-muted px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                  <Lock className="h-2.5 w-2.5" /> Locked
                </span>
              )}
            </div>

            <h1 className="m-0 text-2xl font-black tracking-tight text-foreground sm:text-3xl">
              {song.title}
            </h1>
            <p className="m-0 mt-1 text-lg text-muted-foreground">{song.artist}</p>

            <div className="mt-3 flex gap-2">
              <a
                href={youtubeSearchUrl(`${song.title} ${song.artist} maimai`)}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 rounded-md bg-red-600 px-3 py-1.5 text-sm font-semibold text-white transition-colors hover:bg-red-700"
              >
                <Youtube className="h-4 w-4" />
                YouTube
              </a>
              <ShareButton slug={song.slug} />
            </div>

            {song.comment && (
              <blockquote
                className="mt-3 border-l-2 pl-3 text-sm italic text-muted-foreground"
                style={{ borderLeftColor: catColor }}
              >
                {song.comment}
              </blockquote>
            )}
          </section>

          <section>
            <SectionHeading color={catColor}>Charts</SectionHeading>
            <div className="mt-4 space-y-6">
              {song.isLocked && (
                <div className="flex items-center gap-2 rounded-lg border border-amber-500/20 bg-amber-500/5 px-3 py-2.5 text-sm text-amber-600 dark:text-amber-400">
                  <Lock className="h-4 w-4 flex-shrink-0" />
                  <span>This song requires certain conditions to be playable.</span>
                </div>
              )}

              {[...sheetsByType.entries()].map(([type, sheets]) => (
                <div key={type}>
                  <h3 className="m-0 mb-2 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                    {TYPE_NAMES[type] ?? type}
                  </h3>
                  <div className="space-y-1">
                    {sheets
                      .sort((a, b) => a.levelValue - b.levelValue)
                      .map((sheet, i) => (
                        <ChartRow key={i} sheet={sheet} song={song} />
                      ))}
                  </div>
                </div>
              ))}
            </div>
          </section>

          {utageSheets.length > 0 && (
            <section>
              <SectionHeading color={catColor}>Utage Charts</SectionHeading>
              <div className="mt-4 space-y-1">
                {utageSheets
                  .sort((a, b) => a.levelValue - b.levelValue)
                  .map((sheet, i) => (
                    <ChartRow key={i} sheet={sheet} song={song} />
                  ))}
              </div>
            </section>
          )}

          <section>
            <SectionHeading color={catColor}>Region Availability</SectionHeading>
            <div className="mt-4">
              <div className="overflow-x-auto rounded-lg border">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-muted/30">
                      <th className="px-3 py-2 text-left text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                        Type
                      </th>
                      {REGION_KEYS.map((r) => (
                        <th
                          key={r}
                          className="px-3 py-2 text-center text-[10px] font-bold uppercase tracking-wider text-muted-foreground"
                        >
                          {REGION_LABELS[r] ?? r}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {[...computeTypeRegions(nonUtageSheets).entries()].map(([type, typeRegs]) => (
                      <tr key={type} className="border-b last:border-b-0">
                        <td className="px-3 py-2">
                          <span className="text-xs font-bold text-foreground">
                            {TYPE_NAMES[type] ?? type}
                          </span>
                        </td>
                        {REGION_KEYS.map((r) => (
                          <td key={r} className="px-3 py-2 text-center">
                            {typeRegs[r] ? (
                              <Check className="mx-auto h-4 w-4 text-green-500" />
                            ) : (
                              <X className="mx-auto h-4 w-4 text-muted-foreground/20" />
                            )}
                          </td>
                        ))}
                      </tr>
                    ))}
                    {utageSheets.length > 0 &&
                      [...computeTypeRegions(utageSheets).entries()].map(([type, typeRegs]) => (
                        <tr key={type} className="border-b last:border-b-0">
                          <td className="px-3 py-2">
                            <span className="text-xs font-bold text-foreground">
                              {TYPE_NAMES[type] ?? type}
                            </span>
                          </td>
                          {REGION_KEYS.map((r) => (
                            <td key={r} className="px-3 py-2 text-center">
                              {typeRegs[r] ? (
                                <Check className="mx-auto h-4 w-4 text-green-500" />
                              ) : (
                                <X className="mx-auto h-4 w-4 text-muted-foreground/20" />
                              )}
                            </td>
                          ))}
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

function SectionHeading({ children, color }: { children: React.ReactNode; color: string }) {
  return (
    <div className="flex items-center gap-3 border-b pb-2">
      <div className="h-4 w-1 rounded-full" style={{ backgroundColor: color }} />
      <h2 className="m-0 text-lg font-black text-foreground">{children}</h2>
    </div>
  );
}

function InfoboxRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-2 px-3 py-2">
      <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
        {label}
      </span>
      <span className="text-right text-xs text-foreground">{children}</span>
    </div>
  );
}

function ShareButton({ slug }: { slug: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    const url = `${window.location.origin}/songs/${slug}`;
    void navigator.clipboard.writeText(url).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <button
      type="button"
      onClick={handleCopy}
      className="inline-flex items-center gap-1.5 rounded-md border bg-card px-3 py-1.5 text-sm font-semibold text-foreground transition-colors hover:bg-accent"
    >
      {copied ? (
        <>
          <ClipboardCheck className="h-4 w-4 text-green-500" />
          Copied!
        </>
      ) : (
        <>
          <Share2 className="h-4 w-4" />
          Share
        </>
      )}
    </button>
  );
}

function SongWikiPageSkeleton() {
  return (
    <div className="grid gap-8 lg:grid-cols-[16rem_minmax(0,1fr)] lg:items-start">
      <div className="h-80 w-full animate-pulse rounded-xl bg-muted" />
      <div className="space-y-8">
        <div className="space-y-2">
          <div className="flex gap-2">
            <div className="h-5 w-20 animate-pulse rounded bg-muted" />
            <div className="h-5 w-12 animate-pulse rounded bg-muted" />
          </div>
          <div className="h-9 w-3/4 animate-pulse rounded bg-muted" />
          <div className="h-5 w-1/2 animate-pulse rounded bg-muted" />
        </div>
        <div className="space-y-3">
          <div className="h-6 w-24 animate-pulse rounded bg-muted" />
          <div className="h-48 w-full animate-pulse rounded-lg bg-muted" />
        </div>
      </div>
    </div>
  );
}

function ChartRow({ sheet, song }: { sheet: Sheet; song: MaiDbSong }) {
  const diffColor = DIFFICULTY_COLORS[sheet.difficulty] ?? "#888";
  const diffName = DIFFICULTY_NAMES[sheet.difficulty] ?? sheet.difficulty;
  const nc = sheet.noteCounts;
  const hasBreakdown = nc.tap != null || nc.hold != null;
  const designer = sheet.noteDesigner && sheet.noteDesigner !== "-" ? sheet.noteDesigner : "-";

  return (
    <div
      className="group rounded-lg border px-3 py-2 transition-colors hover:bg-accent/30"
      style={{ borderLeftWidth: "3px", borderLeftColor: diffColor }}
    >
      <div className="flex items-start gap-3">
        <div className="min-w-[7.5rem] pt-0.5 text-xs font-bold" style={{ color: diffColor }}>
          {diffName}
        </div>
        <div className="min-w-0 flex-1 space-y-1">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-baseline sm:justify-between">
            <div className="flex items-baseline gap-2">
              <span className="text-sm font-black text-foreground">{sheet.level}</span>
              {sheet.internalLevelValue > 0 && (
                <span className="text-xs text-muted-foreground">({sheet.internalLevelValue})</span>
              )}
            </div>
            <div className="flex items-center gap-3 sm:justify-end">
              <span className="w-[7.5rem] shrink-0 text-left text-xs text-muted-foreground sm:text-right">
                {nc.total != null && <span className="tabular-nums">{nc.total} notes</span>}
              </span>
              <a
                href={youtubeSearchUrl(`${song.title} maimai ${diffName}`)}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 rounded-md border border-red-500/30 bg-red-500/10 px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-red-600 transition-colors hover:border-red-500/50 hover:bg-red-500/15 hover:text-red-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500/40 dark:text-red-400 dark:hover:text-red-300"
                title={`Search YouTube for ${diffName}`}
              >
                <Youtube className="h-3.5 w-3.5" />
                <span>YT</span>
              </a>
            </div>
          </div>
          <div className="flex flex-col gap-1 text-[11px] text-muted-foreground/80 sm:gap-1.5">
            <span className="min-h-[1rem]">Notes designer: {designer}</span>
            {hasBreakdown && (
              <div className="flex flex-wrap gap-x-4 gap-y-1 tabular-nums text-[11px] text-muted-foreground/80">
                {nc.tap != null && <span>Tap {nc.tap}</span>}
                {nc.hold != null && <span>Hold {nc.hold}</span>}
                {nc.slide != null && <span>Slide {nc.slide}</span>}
                {nc.touch != null && <span>Touch {nc.touch}</span>}
                {nc.break != null && <span>Break {nc.break}</span>}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function groupSheetsByType(sheets: Sheet[]) {
  const map = new Map<string, Sheet[]>();
  for (const sheet of sheets) {
    const existing = map.get(sheet.type) ?? [];
    existing.push(sheet);
    map.set(sheet.type, existing);
  }
  return map;
}

function computeTypeRegions(sheets: Sheet[]) {
  const map = new Map<string, Record<string, boolean>>();
  for (const sheet of sheets) {
    if (!map.has(sheet.type)) {
      map.set(sheet.type, { jp: false, intl: false, usa: false, cn: false });
    }
    const regions = map.get(sheet.type)!;
    for (const key of REGION_KEYS) {
      if (sheet.regions[key]) regions[key] = true;
    }
  }
  return map;
}

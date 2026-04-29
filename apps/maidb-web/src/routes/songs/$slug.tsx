import { createFileRoute, Link } from "@tanstack/react-router";
import type { MaiDbSong, Sheet, SongSeoEntry } from "maidb-data";
import {
  CATEGORY_BY_SLUG,
  DIFFICULTY_COLORS,
  DIFFICULTY_NAMES,
  REGION_LABELS,
  TYPE_NAMES,
  VERSION_BY_SLUG,
} from "maidb-data";
import { useEffect, useMemo, useRef, useState } from "react";
import { getSongBySlug, getMaiNotesCharts, getCounterpartSong, getSongSeo } from "../-server/songs";
import type { MaiNotesEntry } from "../../lib/song-data.server";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  ChevronDown,
  ChevronUp,
  ClipboardCheck,
  Clock,
  ExternalLink,
  Link2,
  Lock,
  Share2,
  X,
  Youtube,
  Zap,
} from "lucide-react";
import { SongImage } from "../../components/song-detail/shared";
import { OG_IMAGE_BASE, OG_IMAGE_FALLBACK, SITE_LOCALE, SITE_NAME, SITE_URL } from "../../lib/site";

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

function buildSongOgDescription(song: MaiDbSong): string {
  return `View ${song.title} by ${song.artist} on MaiDB.`;
}

function buildJsonLd(song: MaiDbSong) {
  const imageUrl = song.internalImageId
    ? `${OG_IMAGE_BASE}/${song.internalImageId}.jpg`
    : undefined;

  const json: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "MusicComposition",
    name: song.title,
    composer: { "@type": "Person", name: song.artist },
    identifier: song.songId,
    inLanguage: "en",
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
  if (imageUrl) json.image = imageUrl;
  if (song.releaseDate) json.datePublished = song.releaseDate;
  return json;
}

function buildBreadcrumbJsonLd(song: MaiDbSong) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: `${SITE_URL}/` },
      { "@type": "ListItem", position: 2, name: "Songs", item: `${SITE_URL}/songs` },
      {
        "@type": "ListItem",
        position: 3,
        name: song.title,
        item: `${SITE_URL}/songs/${song.slug}`,
      },
    ],
  };
}

function buildFaqJsonLd(faq: SongSeoEntry["schema"]["faq"]) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faq.map((item) => ({
      "@type": "Question",
      name: item.q,
      acceptedAnswer: { "@type": "Answer", text: item.a },
    })),
  };
}

function youtubeSearchUrl(query: string) {
  return `https://www.youtube.com/results?search_query=${encodeURIComponent(query).replace(/%20/g, "+")}`;
}

type SeoVideo = SongSeoEntry["schema"]["youtubeVideos"][number];

function getYoutubeVideoId(url: string): string | null {
  const match = url.match(
    /(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([\w-]{11})/,
  );
  return match ? match[1]! : null;
}

function videoTypeLabel(type: SeoVideo["type"]): string {
  switch (type) {
    case "official-video":
      return "Official PV";
    case "chart-basic":
      return "Basic chart";
    case "chart-advanced":
      return "Advanced chart";
    case "chart-expert":
      return "Expert chart";
    case "chart-master":
      return "Master chart";
    case "chart-remaster":
      return "Re:MASTER chart";
  }
}

export const Route = createFileRoute("/songs/$slug")({
  staleTime: Infinity,
  head: ({ loaderData }) => {
    const data = loaderData as unknown as {
      song: MaiDbSong | null;
      seo: SongSeoEntry | null;
    } | null;
    const song = data?.song ?? null;
    const seo = data?.seo ?? null;
    if (!song) {
      return {
        meta: [{ title: "Song Not Found - MaiDB" }, { name: "robots", content: "noindex" }],
      };
    }

    const fallbackDescription = buildSongSeoDescription(song);
    const ogDescription = buildSongOgDescription(song);
    const canonicalUrl = `${SITE_URL}/songs/${song.slug}`;
    const songImage = song.internalImageId
      ? `${OG_IMAGE_BASE}/${song.internalImageId}.jpg`
      : undefined;
    const ogImage = songImage ?? OG_IMAGE_FALLBACK;
    const versionName = VERSION_BY_SLUG[song.version]?.version ?? song.version;
    const fallbackTitle = `${song.title} (${versionName}) by ${song.artist} | MaiDB`;

    const rawTitle = seo ? `${seo.schema.seoTitle} | MaiDB` : fallbackTitle;
    const title = rawTitle.length > 70 ? `${rawTitle.slice(0, 67)}...` : rawTitle;
    const rawDescription = seo?.schema.metaDescription ?? fallbackDescription;
    const description =
      rawDescription.length > 160 ? `${rawDescription.slice(0, 157)}...` : rawDescription;

    // Pages without an AI-generated SEO entry render only the chart table +
    // infobox, which is too thin to index on its own. Noindex until the SEO
    // backfill catches up; the page stays crawlable and link equity flows.
    const robotsContent = seo ? "index,follow" : "noindex,follow";

    const scripts: { type: string; children: string }[] = [
      {
        type: "application/ld+json",
        children: JSON.stringify(buildJsonLd(song)),
      },
      {
        type: "application/ld+json",
        children: JSON.stringify(buildBreadcrumbJsonLd(song)),
      },
    ];
    if (seo && seo.schema.faq.length > 0) {
      scripts.push({
        type: "application/ld+json",
        children: JSON.stringify(buildFaqJsonLd(seo.schema.faq)),
      });
    }

    return {
      meta: [
        { title },
        { name: "description", content: description },
        { name: "robots", content: robotsContent },

        // Open Graph
        { property: "og:type", content: "music.song" },
        { property: "og:title", content: title },
        { property: "og:description", content: ogDescription },
        { property: "og:url", content: canonicalUrl },
        { property: "og:site_name", content: SITE_NAME },
        { property: "og:locale", content: SITE_LOCALE },
        { property: "og:image", content: ogImage },
        { property: "og:image:alt", content: `${song.title} album art` },
        { property: "music:musician", content: song.artist },

        // Twitter Card
        { name: "twitter:card", content: "summary_large_image" },
        { name: "twitter:title", content: title },
        { name: "twitter:description", content: ogDescription },
        { name: "twitter:image", content: ogImage },
      ],
      links: [{ rel: "canonical", href: canonicalUrl }],
      scripts,
    };
  },
  loader: async ({ params }) => {
    const [song, maiNotesCharts, seo] = await Promise.all([
      getSongBySlug({ data: { slug: params.slug } }),
      getMaiNotesCharts({ data: { slug: params.slug } }),
      getSongSeo({ data: { slug: params.slug } }),
    ]);
    const typedSong = song as MaiDbSong | null;
    const counterpart = typedSong
      ? await getCounterpartSong({ data: { songId: typedSong.songId } })
      : null;
    return {
      song: typedSong,
      maiNotesCharts,
      counterpart,
      seo: seo as SongSeoEntry | null,
    };
  },
  component: SongPage,
});

function SongPage() {
  const loaderData = Route.useLoaderData() as {
    song: MaiDbSong | null;
    maiNotesCharts: MaiNotesEntry | null;
    counterpart: MaiDbSong | null;
    seo: SongSeoEntry | null;
  };
  const song = loaderData.song;
  const maiNotesCharts = loaderData.maiNotesCharts;
  const counterpart = loaderData.counterpart;
  const seo = loaderData.seo;
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

        {song ? (
          <SongWikiContent
            song={song}
            maiNotesCharts={maiNotesCharts}
            counterpart={counterpart}
            seo={seo}
          />
        ) : (
          <SongWikiPageSkeleton />
        )}
      </main>
    </>
  );
}

function SongWikiContent({
  song,
  maiNotesCharts,
  counterpart,
  seo,
}: {
  song: MaiDbSong;
  maiNotesCharts: MaiNotesEntry | null;
  counterpart: MaiDbSong | null;
  seo: SongSeoEntry | null;
}) {
  const chartTypes = [...new Set(song.sheets.map((s) => s.type))];
  const catMeta = CATEGORY_BY_SLUG[song.category];
  const catColor = catMeta?.color ?? "#888";
  const verMeta = VERSION_BY_SLUG[song.version];

  const isUtage = song.songId.startsWith("_utage_.");
  const nonUtageSheets = song.sheets.filter((s) => s.type !== "utage");
  const utageSheets = song.sheets.filter((s) => s.type === "utage");
  const sheetsByType = groupSheetsByType(nonUtageSheets);

  // Build lookup: "difficulty|level" -> mai-notes chart (for Play links)
  const maiNotesLookup = useMemo(() => {
    const map = new Map<string, MaiNotesEntry["charts"][number]>();
    if (!maiNotesCharts) return map;
    for (const c of maiNotesCharts.charts) {
      map.set(`${c.difficulty}|${c.level}`, c);
    }
    return map;
  }, [maiNotesCharts]);

  const regions = { jp: false, intl: false, usa: false, cn: false };
  for (const sheet of song.sheets) {
    for (const key of Object.keys(regions) as (keyof typeof regions)[]) {
      if (sheet.regions[key]) regions[key] = true;
    }
  }

  const seoVideos = seo?.schema.youtubeVideos ?? [];
  const officialVideo = seoVideos.find((v) => v.type === "official-video");
  const sidebarVideoUrl =
    officialVideo?.url ?? youtubeSearchUrl(`${song.title} ${song.artist} maimai`);
  const sidebarVideoLabel = officialVideo ? "Official PV" : "YouTube";

  return (
    <div className="space-y-8">
      <div className="grid gap-8 lg:grid-cols-[16rem_minmax(0,1fr)] lg:items-start">
        <aside className="lg:sticky lg:top-24">
          <div
            className="overflow-hidden rounded-xl border bg-card"
            style={{ borderColor: `color-mix(in oklch, ${catColor} 25%, transparent)` }}
          >
            <div className="p-3">
              <div className="relative overflow-hidden rounded-lg">
                <SongImage song={song} size="full" />
                <span
                  className="absolute bottom-0 left-0 rounded-tr-md px-2.5 py-1 text-xs font-bold uppercase tracking-wider text-white backdrop-blur-sm"
                  style={{ backgroundColor: `color-mix(in oklch, ${catColor} 85%, transparent)` }}
                >
                  {catMeta?.category ?? song.category}
                </span>
                <div className="absolute top-0 right-0 flex flex-col items-end">
                  {song.isNew && (
                    <span className="rounded-bl-md bg-primary/85 px-2.5 py-1 text-xs font-bold uppercase tracking-wider text-primary-foreground backdrop-blur-sm">
                      New
                    </span>
                  )}
                  {song.isLocked && (
                    <span className="inline-flex items-center gap-1 rounded-bl-md bg-muted/85 px-2.5 py-1 text-xs font-bold uppercase tracking-wider text-muted-foreground backdrop-blur-sm">
                      <Lock className="h-3 w-3" /> Locked
                    </span>
                  )}
                </div>
              </div>
            </div>
            <div className="space-y-3 px-4 py-4">
              <div>
                <h1 className="m-0 text-base font-black leading-snug tracking-tight text-foreground">
                  {song.title}
                </h1>
                <p className="m-0 mt-0.5 text-xs text-muted-foreground">{song.artist}</p>
              </div>
              <div className="flex gap-1.5">
                <a
                  href={sidebarVideoUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 rounded-md bg-red-600 px-2.5 py-1 text-xs font-semibold text-white transition-colors hover:bg-red-700"
                >
                  <Youtube className="h-3.5 w-3.5" />
                  {sidebarVideoLabel}
                </a>
                <ShareButton slug={song.slug} />
              </div>
              {song.comment && (
                <blockquote
                  className="border-l-2 pl-3 text-xs italic text-muted-foreground"
                  style={{ borderLeftColor: catColor }}
                >
                  {song.comment}
                </blockquote>
              )}
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
              <div className="px-3 py-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                  Regions
                </span>
                <div className="mt-1.5 flex flex-wrap gap-1.5">
                  {(Object.entries(regions) as [string, boolean][]).map(([key, available]) => (
                    <span
                      key={key}
                      className={`inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-semibold ${
                        available
                          ? "bg-green-500/10 text-green-600 dark:text-green-400"
                          : "bg-muted text-muted-foreground/30"
                      }`}
                    >
                      {available ? <Check className="h-3 w-3" /> : <X className="h-3 w-3" />}
                      {REGION_LABELS[key] ?? key}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </aside>

        <div className="min-w-0 space-y-8">
          {counterpart && (
            <Link
              to="/songs/$slug"
              params={{ slug: counterpart.slug }}
              className="flex items-center gap-3 rounded-lg border px-4 py-3 transition-colors hover:bg-accent/30"
              style={{
                borderColor: isUtage
                  ? `color-mix(in oklch, ${catColor} 30%, transparent)`
                  : "color-mix(in oklch, #dc39b8 30%, transparent)",
                backgroundColor: isUtage
                  ? undefined
                  : "color-mix(in oklch, #dc39b8 5%, transparent)",
              }}
            >
              <span
                className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-md text-xs font-bold text-white"
                style={{ backgroundColor: isUtage ? catColor : "#dc39b8" }}
              >
                {isUtage ? "♪" : "宴"}
              </span>
              <span className="min-w-0 flex-1 text-sm font-medium text-foreground">
                {isUtage ? "View regular charts" : "View utage (宴会場) charts"}
              </span>
              <ArrowRight className="h-4 w-4 flex-shrink-0 text-muted-foreground" />
            </Link>
          )}

          {seo && <OverviewSection seo={seo} color={catColor} />}

          {seoVideos.length > 0 && <VideoCarousel videos={seoVideos} color={catColor} />}

          {isUtage ? (
            <section>
              <SectionHeading color={catColor}>Charts</SectionHeading>
              <div className="mt-4 space-y-1">
                {utageSheets
                  .sort((a, b) => a.levelValue - b.levelValue)
                  .map((sheet, i) => (
                    <ChartRow key={i} sheet={sheet} song={song} maiNotesLookup={maiNotesLookup} />
                  ))}
              </div>
            </section>
          ) : (
            <>
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
                            <ChartRow
                              key={i}
                              sheet={sheet}
                              song={song}
                              maiNotesLookup={maiNotesLookup}
                            />
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
                        <ChartRow
                          key={i}
                          sheet={sheet}
                          song={song}
                          maiNotesLookup={maiNotesLookup}
                        />
                      ))}
                  </div>
                </section>
              )}
            </>
          )}

          {seo && seo.schema.trivia.length > 0 && (
            <TriviaSection trivia={seo.schema.trivia} color={catColor} />
          )}

          {seo && seo.schema.faq.length > 0 && <FaqSection faq={seo.schema.faq} color={catColor} />}

          {maiNotesCharts && (maiNotesCharts.gamerch_id || maiNotesCharts.simai_id) && (
            <section>
              <SectionHeading color={catColor}>External Links</SectionHeading>
              <div className="mt-4 flex flex-wrap gap-2">
                {maiNotesCharts.gamerch_id && (
                  <a
                    href={`https://gamerch.com/maimai/${maiNotesCharts.gamerch_id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 rounded-lg border bg-card px-4 py-2.5 text-sm font-semibold text-foreground transition-colors hover:bg-accent"
                  >
                    <img src="/assets/maiwiki-gamerch-logo.png" alt="" className="h-5" />
                    <span>maimai　攻略wiki (JP)</span>
                    <ExternalLink className="h-4 w-4 text-muted-foreground" />
                  </a>
                )}
                {maiNotesCharts.simai_id && (
                  <a
                    href={`https://w.atwiki.jp/simai/pages/${maiNotesCharts.simai_id}.html`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 rounded-lg border bg-card px-4 py-2.5 text-sm font-semibold text-foreground transition-colors hover:bg-accent"
                  >
                    <img src="/assets/atwiki-logo.svg" alt="" className="h-5" />
                    <span>Simai chart wiki (JP)</span>
                    <ExternalLink className="h-4 w-4 text-muted-foreground" />
                  </a>
                )}
              </div>
            </section>
          )}
        </div>
      </div>
    </div>
  );
}

function OverviewSection({ seo, color }: { seo: SongSeoEntry; color: string }) {
  return (
    <section>
      <SectionHeading color={color}>Overview</SectionHeading>
      <Collapsible peek={200}>
        <p className="mt-4 whitespace-pre-line text-justify text-sm leading-relaxed text-foreground/90 hyphens-auto">
          {seo.schema.overview}
        </p>
      </Collapsible>
    </section>
  );
}

function VideoCarousel({ videos, color }: { videos: SeoVideo[]; color: string }) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const items = useMemo(
    () =>
      videos
        .map((v) => ({ ...v, ytId: getYoutubeVideoId(v.url) }))
        .filter((v): v is SeoVideo & { ytId: string } => v.ytId !== null),
    [videos],
  );

  if (items.length === 0) return null;

  const scroll = (dir: -1 | 1) => {
    const el = scrollRef.current;
    if (!el) return;
    const card = el.querySelector<HTMLElement>("[data-video-card]");
    const step = card ? card.offsetWidth + 12 : el.clientWidth;
    el.scrollBy({ left: dir * step, behavior: "smooth" });
  };

  return (
    <section>
      <div className="flex items-center justify-between gap-3 border-b pb-2">
        <div className="flex items-center gap-3">
          <div className="h-4 w-1 rounded-full" style={{ backgroundColor: color }} />
          <h2 className="m-0 text-lg font-black text-foreground">Videos</h2>
        </div>
        {items.length > 1 && (
          <div className="flex items-center gap-0.5 text-muted-foreground">
            <button
              type="button"
              aria-label="Previous video"
              onClick={() => scroll(-1)}
              className="inline-flex h-7 w-7 items-center justify-center rounded-md transition-colors hover:bg-accent hover:text-foreground"
            >
              <ArrowLeft className="h-4 w-4" />
            </button>
            <button
              type="button"
              aria-label="Next video"
              onClick={() => scroll(1)}
              className="inline-flex h-7 w-7 items-center justify-center rounded-md transition-colors hover:bg-accent hover:text-foreground"
            >
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>
      <div
        ref={scrollRef}
        className="mt-4 flex snap-x snap-mandatory gap-3 overflow-x-auto pb-3 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {items.map((v, i) => (
          <VideoCard key={i} video={v} />
        ))}
      </div>
    </section>
  );
}

function VideoCard({ video }: { video: SeoVideo & { ytId: string } }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    void navigator.clipboard.writeText(video.url).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const label = videoTypeLabel(video.type);

  return (
    <div
      data-video-card
      className="min-w-full shrink-0 snap-start rounded-lg border bg-muted/30 p-2 sm:min-w-[28rem]"
    >
      <div className="aspect-video w-full overflow-hidden rounded-md bg-black">
        <iframe
          src={`https://www.youtube-nocookie.com/embed/${video.ytId}`}
          title={label}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          loading="lazy"
          className="h-full w-full"
        />
      </div>
      <div className="mt-2 flex items-center justify-between gap-2 px-0.5">
        <p className="m-0 text-xs font-semibold text-muted-foreground">{label}</p>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={handleCopy}
            className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-semibold text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
          >
            {copied ? (
              <>
                <ClipboardCheck className="h-3.5 w-3.5 text-green-500" />
                Copied
              </>
            ) : (
              <>
                <Link2 className="h-3.5 w-3.5" />
                Copy link
              </>
            )}
          </button>
          <a
            href={video.url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-semibold text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
          >
            <ExternalLink className="h-3.5 w-3.5" />
            Open
          </a>
        </div>
      </div>
    </div>
  );
}

function TriviaSection({ trivia, color }: { trivia: string[]; color: string }) {
  return (
    <section>
      <SectionHeading color={color}>Trivia</SectionHeading>
      <Collapsible peek={220}>
        <ul className="mt-4 list-disc space-y-2 pl-5 text-justify text-sm leading-relaxed text-foreground/90 hyphens-auto">
          {trivia.map((item, i) => (
            <li key={i}>{item}</li>
          ))}
        </ul>
      </Collapsible>
    </section>
  );
}

function FaqSection({ faq, color }: { faq: { q: string; a: string }[]; color: string }) {
  return (
    <section>
      <SectionHeading color={color}>FAQ</SectionHeading>
      <Collapsible peek={280}>
        <dl className="mt-4 space-y-4">
          {faq.map((item, i) => (
            <div key={i} className="rounded-lg border bg-card px-4 py-3">
              <dt className="text-sm font-bold text-foreground">{item.q}</dt>
              <dd className="mt-1.5 whitespace-pre-line text-justify text-sm leading-relaxed text-foreground/80 hyphens-auto">
                {item.a}
              </dd>
            </div>
          ))}
        </dl>
      </Collapsible>
    </section>
  );
}

function Collapsible({ children, peek = 240 }: { children: React.ReactNode; peek?: number }) {
  const [open, setOpen] = useState(false);
  const [needsCollapse, setNeedsCollapse] = useState(true);
  const [contentHeight, setContentHeight] = useState<number | null>(null);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const measure = () => {
      const h = el.scrollHeight;
      setContentHeight(h);
      setNeedsCollapse(h > peek + 16);
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [peek]);

  const collapsed = needsCollapse && !open;
  // When open we add a small buffer so subpixel rounding can't clip the last line.
  const expandedHeight = contentHeight != null ? contentHeight + 8 : undefined;
  const maxHeight = needsCollapse ? (open ? expandedHeight : peek) : expandedHeight;

  return (
    <div>
      <div
        ref={wrapRef}
        className="relative overflow-hidden transition-[max-height] duration-500 ease-in-out motion-reduce:transition-none"
        style={{ maxHeight: maxHeight != null ? `${maxHeight}px` : undefined }}
      >
        {children}
        <div
          aria-hidden
          className={`pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-background via-background/85 to-transparent transition-opacity duration-300 ${
            collapsed ? "opacity-100" : "opacity-0"
          }`}
        />
      </div>
      {needsCollapse && (
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          aria-expanded={open}
          className="mt-3 inline-flex items-center gap-1 rounded-md border bg-card px-3 py-1.5 text-xs font-semibold text-foreground/80 transition-colors hover:bg-accent hover:text-foreground"
        >
          {open ? (
            <>
              Show less
              <ChevronUp className="h-3.5 w-3.5" />
            </>
          ) : (
            <>
              Show more
              <ChevronDown className="h-3.5 w-3.5" />
            </>
          )}
        </button>
      )}
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
      className="inline-flex items-center gap-1 rounded-md border bg-card px-2.5 py-1 text-xs font-semibold text-foreground transition-colors hover:bg-accent"
    >
      {copied ? (
        <>
          <ClipboardCheck className="h-3.5 w-3.5 text-green-500" />
          Copied!
        </>
      ) : (
        <>
          <Share2 className="h-3.5 w-3.5" />
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

function ChartRow({
  sheet,
  song,
  maiNotesLookup,
}: {
  sheet: Sheet;
  song: MaiDbSong;
  maiNotesLookup: Map<string, MaiNotesEntry["charts"][number]>;
}) {
  const diffColor = DIFFICULTY_COLORS[sheet.difficulty] ?? "#888";
  const diffName = DIFFICULTY_NAMES[sheet.difficulty] ?? sheet.difficulty;
  const nc = sheet.noteCounts;
  const hasBreakdown = nc.tap != null || nc.hold != null;
  const designer = sheet.noteDesigner && sheet.noteDesigner !== "-" ? sheet.noteDesigner : "-";
  const maiNotesChart = maiNotesLookup.get(`${sheet.difficulty}|${sheet.level}`);
  const chartSearchUrl = youtubeSearchUrl(`${song.title} maimai ${diffName}`);

  return (
    <div
      className="group grid grid-cols-[5.5rem_1fr] items-start gap-3 rounded-lg border px-3 py-2.5 transition-colors hover:bg-accent/30"
      style={{ borderLeftWidth: "3px", borderLeftColor: diffColor }}
    >
      {/* Column 1: Difficulty + Level */}
      <div className="space-y-0.5">
        <div className="text-xs font-bold" style={{ color: diffColor }}>
          {diffName}
        </div>
        <div className="flex items-baseline gap-1">
          <span className="text-lg font-black leading-tight text-foreground">{sheet.level}</span>
          {sheet.internalLevelValue > 0 && (
            <span className="text-xs text-muted-foreground">({sheet.internalLevelValue})</span>
          )}
        </div>
      </div>

      {/* Column 2: Metadata + Buttons */}
      <div className="min-w-0 space-y-2.5">
        {/* Metadata */}
        <div className="flex flex-wrap items-baseline gap-x-3 gap-y-0.5 text-xs">
          {nc.total != null && (
            <span className="font-bold tabular-nums text-foreground">{nc.total} notes</span>
          )}
          <span className="text-muted-foreground">
            Designer: <span className="font-medium text-foreground/80">{designer}</span>
          </span>
          {hasBreakdown && (
            <>
              <span className="text-muted-foreground/30">|</span>
              {nc.tap != null && (
                <span className="tabular-nums text-muted-foreground">Tap {nc.tap}</span>
              )}
              {nc.hold != null && (
                <span className="tabular-nums text-muted-foreground">Hold {nc.hold}</span>
              )}
              {nc.slide != null && (
                <span className="tabular-nums text-muted-foreground">Slide {nc.slide}</span>
              )}
              {nc.touch != null && (
                <span className="tabular-nums text-muted-foreground">Touch {nc.touch}</span>
              )}
              {nc.break != null && (
                <span className="tabular-nums text-muted-foreground">Break {nc.break}</span>
              )}
            </>
          )}
        </div>

        {/* Buttons */}
        <div className="flex flex-wrap items-center gap-1.5">
          {maiNotesChart?.has_chart_data && (
            <a
              href={`https://mai-notes.com/player?chart=${maiNotesChart.id}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 rounded-md border border-cyan-500/30 bg-cyan-500/10 px-2.5 py-1.5 text-xs font-semibold text-cyan-600 transition-colors hover:border-cyan-500/50 hover:bg-cyan-500/15 hover:text-cyan-700 dark:text-cyan-400 dark:hover:text-cyan-300"
              title="Preview chart on maiノーツ"
            >
              <img src="/assets/mainotes-logo.png" alt="" className="h-3.5" />
              <span>View chart</span>
            </a>
          )}
          <a
            href={chartSearchUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 rounded-md border border-red-500/30 bg-red-500/10 px-2.5 py-1.5 text-xs font-semibold text-red-600 transition-colors hover:border-red-500/50 hover:bg-red-500/15 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
            title={`Search YouTube for ${diffName}`}
          >
            <Youtube className="h-4 w-4" />
            <span>YouTube</span>
          </a>
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

import { Link, createFileRoute } from "@tanstack/react-router";
import { ArrowRight, ExternalLink, Heart, Info, Sparkles } from "lucide-react";
import { OG_IMAGE_LOCAL_BASE, SITE_LOCALE, SITE_NAME, SITE_URL } from "../lib/site";

const ABOUT_TITLE = "About - MaiDB";
const ABOUT_DESCRIPTION =
  "MaiDB is an unofficial, fan-built index of every maimai song. Compiled from many community sources into one fast, searchable catalog.";
const ABOUT_CANONICAL = `${SITE_URL}/about`;
const ABOUT_OG_IMAGE = `${OG_IMAGE_LOCAL_BASE}/meta-about.jpg`;

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: ABOUT_TITLE },
      { name: "description", content: ABOUT_DESCRIPTION },

      { property: "og:type", content: "website" },
      { property: "og:title", content: ABOUT_TITLE },
      { property: "og:description", content: ABOUT_DESCRIPTION },
      { property: "og:url", content: ABOUT_CANONICAL },
      { property: "og:site_name", content: SITE_NAME },
      { property: "og:locale", content: SITE_LOCALE },
      { property: "og:image", content: ABOUT_OG_IMAGE },
      { property: "og:image:alt", content: "About MaiDB" },

      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: ABOUT_TITLE },
      { name: "twitter:description", content: ABOUT_DESCRIPTION },
      { name: "twitter:image", content: ABOUT_OG_IMAGE },
    ],
    links: [{ rel: "canonical", href: ABOUT_CANONICAL }],
  }),
  component: About,
});

interface CreditLink {
  href: string;
  title: string;
  description: string;
}

const CREDITS: CreditLink[] = [
  {
    href: "https://arcade-songs.zetaraku.dev/",
    title: "arcade-songs by zetaraku",
    description: "The original maimai song browser that made indexing the catalog feel possible.",
  },
  {
    href: "https://github.com/lomotos10/GCM-bot/tree/main/src",
    title: "GCM-bot by lomotos10",
    description: "Source for keyword aliases, helping fuzzy search find songs by every nickname.",
  },
  {
    href: "https://gamerch.com/maimai",
    title: "Gamerch maimai wiki",
    description: "Composite source for chart constants, version notes, and metadata cross-checks.",
  },
  {
    href: "https://silentblue.remywiki.com",
    title: "RemyWiki (silentblue)",
    description: "Composite source for song histories, romanizations, and release timelines.",
  },
];

function About() {
  return (
    <>
      <section className="relative overflow-hidden border-b border-border bg-primary/[0.025] dark:bg-transparent">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-[0.09] mix-blend-multiply [background-image:url(/assets/illustration/bg_pattern.png)] [background-size:420px] dark:opacity-[0.05] dark:mix-blend-screen"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -left-32 -top-32 h-[320px] w-[320px] rounded-full bg-primary/15 blur-3xl dark:bg-primary/10"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -bottom-32 right-1/4 h-[260px] w-[260px] rounded-full bg-primary/10 blur-3xl dark:bg-primary/5"
        />

        <img
          src="/assets/illustration/tile_purple_left.png"
          alt=""
          aria-hidden
          loading="eager"
          className="pointer-events-none absolute -left-4 top-2 hidden h-[200px] w-auto opacity-50 md:block"
          style={{ animation: "home-drift 9s ease-in-out infinite" }}
        />
        <img
          src="/assets/illustration/tile_green.png"
          alt=""
          aria-hidden
          loading="eager"
          className="pointer-events-none absolute -right-6 -top-2 hidden h-[220px] w-auto opacity-40 lg:block"
          style={{ animation: "home-drift 11s ease-in-out infinite reverse" }}
        />

        <div className="relative mx-auto grid max-w-5xl grid-cols-1 items-center gap-6 px-4 py-10 sm:py-12 md:grid-cols-[1.05fr_0.95fr]">
          <div className="relative max-w-xl">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-primary">
              <Sparkles className="h-3 w-3" />
              About MaiDB
            </span>
            <h1 className="mt-3 text-3xl font-black leading-[1.05] tracking-tight text-foreground sm:text-4xl">
              A fan-built index for{" "}
              <span className="relative inline-block">
                every maimai song.
                <span
                  aria-hidden
                  className="absolute -bottom-0.5 left-0 h-[2px] w-full origin-left bg-primary"
                  style={{
                    animation: "home-underline 0.7s cubic-bezier(0.2,0.7,0.2,1) 400ms backwards",
                  }}
                />
              </span>
            </h1>
            <p className="mt-4 max-w-md text-sm leading-relaxed text-muted-foreground">
              MaiDB is an unofficial site for exploring songs available on maimai. It is compiled
              from many community sources and rebuilt as a single, fast, searchable catalog.
            </p>

            <div className="relative z-10 mt-5 flex flex-wrap gap-2">
              <Link
                to="/songs"
                className="group inline-flex items-center gap-1.5 rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
              >
                Browse the catalog
                <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5" />
              </Link>
              <Link
                to="/"
                className="inline-flex items-center gap-1.5 rounded-md border border-border bg-card px-4 py-2 text-sm font-semibold text-foreground transition-colors hover:border-primary/40 hover:text-primary"
              >
                Back to home
              </Link>
            </div>
          </div>

          <div className="pointer-events-none relative hidden md:block">
            <img
              src="/assets/illustration/circle_yellow.png"
              alt=""
              aria-hidden
              className="pointer-events-none absolute -right-8 -top-12 h-[260px] w-auto opacity-70"
              style={{ animation: "home-float-lg 7s ease-in-out infinite" }}
            />
            <img
              src="/assets/illustration/3d_glove_blue.png"
              alt=""
              aria-hidden
              className="pointer-events-none absolute -left-2 top-6 h-14 w-auto -rotate-12 md:left-2"
              style={{ animation: "home-float 4s ease-in-out infinite" }}
            />
            <img
              src="/assets/illustration/3d_cube.png"
              alt=""
              aria-hidden
              className="pointer-events-none absolute bottom-4 left-10 h-10 w-auto rotate-12"
              style={{
                animation: "home-float 5s ease-in-out infinite",
                animationDelay: "300ms",
              }}
            />
            <img
              src="/assets/illustration/star_pink.png"
              alt=""
              aria-hidden
              className="pointer-events-none absolute right-6 top-2 h-9 w-auto"
              style={{
                animation: "home-float 3.5s ease-in-out infinite",
                animationDelay: "150ms",
              }}
            />
            <img
              src="/assets/illustration/chara-right.png"
              alt="maimai character"
              className="absolute -top-12 right-0 h-[300px] w-auto lg:-top-16 lg:h-[360px]"
              style={{ animation: "home-float-lg 6s ease-in-out infinite" }}
            />
          </div>
        </div>
      </section>

      <main className="mx-auto max-w-5xl px-4 pb-20" data-song-browser-surface="">
        <section className="mt-12">
          <div className="mb-5 flex flex-col gap-1 border-b border-border pb-3">
            <div className="flex items-center gap-2.5">
              <Info className="h-4 w-4 text-primary" />
              <h2 className="m-0 text-lg font-black uppercase tracking-wide text-foreground sm:text-xl">
                What this site is
              </h2>
            </div>
          </div>

          <div className="space-y-4 text-justify text-sm leading-7 text-foreground/90">
            <p className="m-0">
              MaiDB is an <strong className="font-bold text-foreground">unofficial</strong>,
              community-built site for exploring songs that are available on maimai. The goal is
              simple: make it fast to find a song, see its difficulty levels, BPM, version, and
              chart constants, and link out to the people who actually made it possible.
            </p>
            <p className="m-0">
              Every entry in the catalog is{" "}
              <strong className="font-bold text-foreground">
                compiled from many different sources
              </strong>{" "}
              — community wikis, public bots, fan-maintained datasets — and reshaped into one
              consistent format. That means a song looked up here should look and feel the same
              whether it's a brand new release or a genre staple from years ago.
            </p>
            <p className="m-0">
              <strong className="font-bold text-foreground">No copyright is intended.</strong> MaiDB
              does not host audio, charts, or any copyrighted content. Song titles, jacket imagery,
              artist names, and the maimai trademark all belong to their respective owners.
              Everything here is metadata for discovery — the same kind of information you'd find on
              a community wiki, just packaged into a faster index.
            </p>
            <p className="m-0">
              If you are a rights holder and want something removed or corrected, please reach out
              and it will be handled as quickly as possible.
            </p>
          </div>
        </section>

        <section className="mt-14">
          <div className="mb-5 flex flex-col gap-1 border-b border-border pb-3">
            <div className="flex items-center gap-2.5">
              <Heart className="h-4 w-4 text-primary" />
              <h2 className="m-0 text-lg font-black uppercase tracking-wide text-foreground sm:text-xl">
                Credits
              </h2>
            </div>
            <p className="m-0 text-xs leading-relaxed text-muted-foreground">
              MaiDB only exists because of these projects. Please go support them.
            </p>
          </div>

          <ul className="divide-y divide-border border-y border-border">
            {CREDITS.map((credit) => (
              <li key={credit.href}>
                <a
                  href={credit.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group flex items-start gap-3 py-4 transition-colors hover:text-primary"
                >
                  <ExternalLink className="mt-1 h-3.5 w-3.5 shrink-0 text-muted-foreground transition-colors group-hover:text-primary" />
                  <div className="min-w-0 flex-1">
                    <p className="m-0 text-sm font-bold text-foreground transition-colors group-hover:text-primary">
                      {credit.title}
                    </p>
                    <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                      {credit.description}
                    </p>
                    <p className="mt-1.5 truncate text-[11px] font-medium text-muted-foreground/70">
                      {credit.href}
                    </p>
                  </div>
                </a>
              </li>
            ))}
          </ul>
        </section>

        <section className="group relative mt-16 overflow-hidden border border-border bg-card transition-colors duration-300 hover:border-primary/40">
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 opacity-[0.05] [background-image:url(/assets/illustration/bg_pattern.png)] [background-size:380px]"
          />
          <div className="relative grid grid-cols-1 items-center gap-4 px-6 py-6 sm:grid-cols-[1fr_auto] sm:gap-8 sm:px-10 sm:py-8">
            <div>
              <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.32em] text-primary">
                Thank you
              </p>
              <p className="m-0 text-xl font-black tracking-tight text-foreground sm:text-2xl">
                Made by fans, for fans of maimai.
              </p>
              <Link
                to="/songs"
                className="mt-3 inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.18em] text-primary transition-colors hover:text-primary/80"
              >
                Open the catalog
                <ArrowRight className="h-3 w-3 transition-transform duration-300 group-hover:translate-x-1" />
              </Link>
            </div>
            <img
              src="/assets/illustration/inline_characters.webp"
              alt=""
              aria-hidden
              className="h-16 w-auto justify-self-end transition-transform duration-500 group-hover:-translate-y-1 sm:h-20"
              style={{ animation: "home-float 5s ease-in-out infinite" }}
            />
          </div>
        </section>
      </main>
    </>
  );
}

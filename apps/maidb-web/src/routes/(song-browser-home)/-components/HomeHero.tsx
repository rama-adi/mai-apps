import { Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import { InlineOmnibox } from "../../../components/omnisearch/InlineOmnibox";

export function HomeHero() {
  return (
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
        className="pointer-events-none absolute -left-4 top-2 hidden h-[220px] w-auto opacity-50 md:block"
        style={{ animation: "home-drift 9s ease-in-out infinite" }}
      />
      <img
        src="/assets/illustration/tile_green.png"
        alt=""
        aria-hidden
        loading="eager"
        className="pointer-events-none absolute -right-4 -top-2 hidden h-[240px] w-auto opacity-40 lg:block"
        style={{ animation: "home-drift 11s ease-in-out infinite reverse" }}
      />

      <div className="relative mx-auto grid max-w-5xl grid-cols-1 items-center gap-6 px-4 py-6 sm:py-8 md:grid-cols-[1.05fr_0.95fr]">
        <div className="relative max-w-xl">
          <h1 className="m-0 text-3xl font-black leading-[1.05] tracking-tight text-foreground sm:text-4xl">
            Every maimai song,
            <br />
            <span className="relative inline-block">
              indexed.
              <span
                aria-hidden
                className="absolute -bottom-0.5 left-0 h-[2px] w-full origin-left bg-primary"
                style={{
                  animation: "home-underline 0.7s cubic-bezier(0.2,0.7,0.2,1) 400ms backwards",
                }}
              />
            </span>
          </h1>

          <p className="mt-3 max-w-md text-sm leading-relaxed text-muted-foreground">
            Charts, difficulty levels, BPM, and version history.
          </p>

          <div className="relative z-10 mt-5">
            <InlineOmnibox showLatestWhenEmpty={false} />
            <Link
              to="/songs"
              className="group mt-3 inline-flex items-center gap-1 text-sm font-semibold text-primary transition-colors hover:text-primary/80"
            >
              See all songs
              <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5" />
            </Link>
          </div>
        </div>

        <div className="pointer-events-none relative hidden md:block">
          <img
            src="/assets/illustration/circle_yellow.png"
            alt=""
            aria-hidden
            className="pointer-events-none absolute -right-8 -top-12 h-[280px] w-auto opacity-70"
            style={{ animation: "home-float-lg 7s ease-in-out infinite" }}
          />
          <img
            src="/assets/illustration/3d_glove_pink.png"
            alt=""
            aria-hidden
            className="pointer-events-none absolute -left-2 top-6 h-14 w-auto -rotate-12 md:left-2"
            style={{ animation: "home-float 4s ease-in-out infinite" }}
          />
          <img
            src="/assets/illustration/3d_cube.png"
            alt=""
            aria-hidden
            className="pointer-events-none absolute bottom-2 left-8 h-10 w-auto rotate-12"
            style={{
              animation: "home-float 5s ease-in-out infinite",
              animationDelay: "300ms",
            }}
          />
          <img
            src="/assets/illustration/3d_star_small.png"
            alt=""
            aria-hidden
            className="pointer-events-none absolute right-4 top-2 h-8 w-auto"
            style={{
              animation: "home-float 3.5s ease-in-out infinite",
              animationDelay: "150ms",
            }}
          />
          <img
            src="/assets/illustration/chara.png"
            alt="maimai character"
            className="absolute -top-16 right-0 h-[340px] w-auto lg:-top-20 lg:h-[400px]"
            style={{ animation: "home-float-lg 6s ease-in-out infinite" }}
          />
        </div>
      </div>
    </section>
  );
}

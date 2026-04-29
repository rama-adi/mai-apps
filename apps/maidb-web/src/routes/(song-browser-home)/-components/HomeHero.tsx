import { Link } from "@tanstack/react-router";
import { ArrowRight, Search } from "lucide-react";

const RISE = "home-rise 0.6s cubic-bezier(0.2,0.7,0.2,1) backwards";

export function HomeHero() {
  return (
    <section className="relative -mt-8 overflow-hidden border-b border-border bg-primary/[0.025] dark:bg-transparent">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.09] mix-blend-multiply [background-image:url(/assets/illustration/bg_pattern.png)] [background-size:520px] dark:opacity-[0.05] dark:mix-blend-screen"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -left-40 -top-40 h-[520px] w-[520px] rounded-full bg-primary/15 blur-3xl dark:bg-primary/10"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -bottom-40 right-1/4 h-[420px] w-[420px] rounded-full bg-primary/10 blur-3xl dark:bg-primary/5"
      />

      <img
        src="/assets/illustration/tile_purple_left.png"
        alt=""
        aria-hidden
        loading="eager"
        data-home-anim
        className="pointer-events-none absolute -left-4 top-10 hidden h-[420px] w-auto opacity-50 md:block"
        style={{ animation: "home-drift 9s ease-in-out infinite" }}
      />
      <img
        src="/assets/illustration/tile_green.png"
        alt=""
        aria-hidden
        loading="eager"
        data-home-anim
        className="pointer-events-none absolute -right-4 -top-2 hidden h-[460px] w-auto opacity-40 lg:block"
        style={{ animation: "home-drift 11s ease-in-out infinite reverse" }}
      />

      <div className="relative mx-auto grid max-w-5xl grid-cols-1 gap-10 px-4 pb-16 pt-16 sm:pt-24 md:grid-cols-[1.05fr_0.95fr] md:gap-6">
        <div className="relative max-w-xl">
          <div
            className="mb-7 flex items-center gap-3"
            data-home-anim
            style={{ animation: RISE, animationDelay: "0ms" }}
          >
            <span aria-hidden className="h-px w-8 bg-primary" />
            <p className="m-0 text-[10px] font-bold uppercase tracking-[0.32em] text-primary">
              Welcome to MaiDB
            </p>
          </div>

          <h1
            className="m-0 text-[clamp(2.4rem,6.2vw,4.5rem)] font-black leading-[0.98] tracking-tight text-foreground"
            data-home-anim
            style={{ animation: RISE, animationDelay: "80ms" }}
          >
            Every maimai song,
            <br />
            <span className="relative inline-block">
              indexed.
              <span
                aria-hidden
                data-home-anim
                className="absolute -bottom-1 left-0 h-[3px] w-full origin-left bg-primary"
                style={{
                  animation: "home-underline 0.7s cubic-bezier(0.2,0.7,0.2,1) 600ms backwards",
                }}
              />
            </span>
          </h1>

          <p
            className="mt-7 max-w-md text-base leading-relaxed text-muted-foreground"
            data-home-anim
            style={{ animation: RISE, animationDelay: "160ms" }}
          >
            Charts, difficulty levels, BPM, and version history.
          </p>

          <div
            className="mt-8 flex flex-wrap items-center gap-3"
            data-home-anim
            style={{ animation: RISE, animationDelay: "240ms" }}
          >
            <Link
              to="/songs"
              className="group inline-flex items-center gap-2 border border-primary bg-primary px-6 py-3 text-sm font-bold tracking-wide text-primary-foreground transition-colors hover:bg-primary/90"
            >
              <Search className="h-4 w-4 transition-transform duration-300 group-hover:rotate-[-8deg]" />
              Browse all songs
              <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
            </Link>
            <Link
              to="/songs"
              search={{ isNew: true }}
              className="group inline-flex items-center gap-2 border border-border bg-background px-6 py-3 text-sm font-bold tracking-wide text-foreground transition-all duration-200 hover:border-primary hover:text-primary"
            >
              See what&rsquo;s new
              <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-0.5" />
            </Link>
          </div>
        </div>

        <div
          className="relative flex min-h-[420px] items-end justify-center md:justify-end"
          data-home-anim
          style={{ animation: RISE, animationDelay: "200ms" }}
        >
          <img
            src="/assets/illustration/circle_yellow.png"
            alt=""
            aria-hidden
            data-home-anim
            className="pointer-events-none absolute right-0 top-0 h-[420px] w-auto opacity-70"
            style={{ animation: "home-float-lg 7s ease-in-out infinite" }}
          />
          <img
            src="/assets/illustration/3d_glove_pink.png"
            alt=""
            aria-hidden
            data-home-anim
            className="pointer-events-none absolute -left-2 top-12 h-20 w-auto -rotate-12 md:left-2"
            style={{ animation: "home-float 4s ease-in-out infinite" }}
          />
          <img
            src="/assets/illustration/3d_cube.png"
            alt=""
            aria-hidden
            data-home-anim
            className="pointer-events-none absolute bottom-2 left-8 h-14 w-auto rotate-12"
            style={{
              animation: "home-float 5s ease-in-out infinite",
              animationDelay: "300ms",
            }}
          />
          <img
            src="/assets/illustration/3d_star_small.png"
            alt=""
            aria-hidden
            data-home-anim
            className="pointer-events-none absolute right-6 top-4 h-10 w-auto"
            style={{
              animation: "home-float 3.5s ease-in-out infinite",
              animationDelay: "150ms",
            }}
          />
          <img
            src="/assets/illustration/chara.png"
            alt="maimai character"
            data-home-anim
            className="relative h-[400px] w-auto sm:h-[460px]"
            style={{ animation: "home-float-lg 6s ease-in-out infinite" }}
          />
        </div>
      </div>
    </section>
  );
}

import { Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";

export function HomeBanner() {
  return (
    <section className="group relative mt-16 overflow-hidden border border-border bg-card transition-colors duration-300 hover:border-primary/40">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.05] [background-image:url(/assets/illustration/bg_pattern.png)] [background-size:380px]"
      />
      <div className="relative grid grid-cols-1 items-center gap-4 px-6 py-6 sm:grid-cols-[1fr_auto] sm:gap-8 sm:px-10 sm:py-8">
        <div>
          <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.32em] text-primary">
            MaiDB
          </p>
          <p className="m-0 text-xl font-black tracking-tight text-foreground sm:text-2xl">
            An open index of every maimai song.
          </p>
          <Link
            to="/about"
            className="mt-3 inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.18em] text-primary transition-colors hover:text-primary/80"
          >
            About us
            <ArrowRight className="h-3 w-3 transition-transform duration-300 group-hover:translate-x-1" />
          </Link>
        </div>
        <img
          src="/assets/illustration/inline_characters.webp"
          alt=""
          aria-hidden
          data-home-anim
          className="h-16 w-auto justify-self-end transition-transform duration-500 group-hover:-translate-y-1 sm:h-20"
          style={{ animation: "home-float 5s ease-in-out infinite" }}
        />
      </div>
    </section>
  );
}

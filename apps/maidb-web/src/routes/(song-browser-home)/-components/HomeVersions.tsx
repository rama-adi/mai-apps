import { Link } from "@tanstack/react-router";
import type { Metadata } from "maidb-data";
import { HomeSectionHeader } from "./HomeSectionHeader";

interface HomeVersionsProps {
  versions: Metadata["versions"];
  compact?: boolean;
}

export function HomeVersions({ versions, compact = false }: HomeVersionsProps) {
  const reversed = [...versions].reverse();
  const total = versions.length;

  return (
    <section className={compact ? "relative" : "relative mt-16"}>
      {compact ? null : (
        <HomeSectionHeader title="Versions" description="Every maimai release, newest first." />
      )}

      <div
        className={
          compact
            ? "grid grid-cols-1 border-l border-t border-border"
            : "grid grid-cols-1 border-l border-t border-border sm:grid-cols-2 lg:grid-cols-3"
        }
      >
        {reversed.map((ver, i) => (
          <Link
            key={ver.slug}
            to="/version/$slug"
            params={{ slug: ver.slug }}
            className="group flex items-center gap-3 border-b border-r border-border bg-card px-4 py-3 transition-all duration-300 hover:border-primary/40 hover:bg-accent/40"
          >
            <span className="flex h-7 w-7 flex-shrink-0 items-center justify-center border border-primary/30 bg-primary/5 font-mono text-[10px] font-black tabular-nums text-primary transition-all duration-300 group-hover:border-primary group-hover:bg-primary group-hover:text-primary-foreground">
              {String(total - i).padStart(2, "0")}
            </span>
            <div className="min-w-0 flex-1">
              <span className="block truncate text-sm font-bold uppercase tracking-wide text-card-foreground">
                {ver.abbr}
              </span>
            </div>
            <span className="flex-shrink-0 font-mono text-[10px] tabular-nums text-muted-foreground">
              {ver.releaseDate}
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
}

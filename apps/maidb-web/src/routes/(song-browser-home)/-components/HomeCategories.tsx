import { Link } from "@tanstack/react-router";
import { ArrowUpRight } from "lucide-react";
import type { Metadata } from "maidb-data";
import { HomeSectionHeader } from "./HomeSectionHeader";

interface HomeCategoriesProps {
  categories: Metadata["categories"];
}

export function HomeCategories({ categories }: HomeCategoriesProps) {
  return (
    <section className="relative mt-16">
      <HomeSectionHeader index="02" title="Categories" description="Browse the catalog by genre." />

      <div className="grid grid-cols-1 border-l border-t border-border sm:grid-cols-2 lg:grid-cols-3">
        {categories.map((cat, idx) => (
          <Link
            key={cat.slug}
            to="/songs"
            search={{ category: cat.slug }}
            className="group relative flex items-center gap-4 border-b border-r border-border bg-card p-4 transition-all duration-300 hover:border-primary/40 hover:bg-accent/40"
          >
            <span
              aria-hidden
              className="font-mono text-[10px] tabular-nums text-muted-foreground/70"
            >
              {String(idx + 1).padStart(2, "0")}
            </span>
            <div
              aria-hidden
              className="flex h-9 w-9 flex-shrink-0 items-center justify-center border border-border transition-all duration-300 group-hover:scale-110 group-hover:border-transparent"
              style={{
                backgroundColor: `color-mix(in oklch, ${cat.color} 14%, transparent)`,
              }}
            >
              <span className="h-2 w-2 rounded-full" style={{ backgroundColor: cat.color }} />
            </div>
            <span className="flex-1 truncate text-sm font-bold uppercase tracking-wide text-card-foreground">
              {cat.category}
            </span>
            <ArrowUpRight className="h-4 w-4 -translate-x-1 text-muted-foreground opacity-0 transition-all duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0 group-hover:text-primary group-hover:opacity-100" />
          </Link>
        ))}
      </div>
    </section>
  );
}

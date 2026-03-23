import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import type { Metadata } from "maidb-data";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { getMetadata } from "../-server/index";

export const Route = createFileRoute("/version/")({
  head: () => ({
    meta: [
      { title: "Versions - MaiDB" },
      {
        name: "description",
        content: "Browse all maimai versions and their release timelines.",
      },
    ],
  }),
  loader: async () => {
    const metadata = await getMetadata();
    return { metadata };
  },
  component: VersionIndexPage,
});

function VersionIndexPage() {
  const { metadata } = Route.useLoaderData() as { metadata: Metadata };
  const router = useRouter();

  return (
    <main className="mx-auto max-w-5xl flex-1 px-4 pb-12 pt-6">
      <button
        type="button"
        onClick={() => router.history.back()}
        className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        Back
      </button>

      <section className="mb-8 rounded-2xl border bg-card p-6 sm:p-8">
        <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.28em] text-primary">
          All Versions
        </p>
        <h1 className="m-0 text-3xl font-black tracking-tight text-foreground sm:text-4xl">
          Version History
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-muted-foreground sm:text-base">
          Every maimai version from the original release to today. Select a version to see its songs
          grouped by weekly release date.
        </p>
      </section>

      <div className="grid gap-1.5 sm:grid-cols-2 lg:grid-cols-3">
        {[...metadata.versions].reverse().map((ver, i) => (
          <Link
            key={ver.slug}
            to="/version/$slug"
            params={{ slug: ver.slug }}
            className="group flex items-center gap-3 rounded-lg border bg-card px-4 py-2.5 transition-all hover:bg-accent/50 hover:shadow-sm"
          >
            <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-primary/10 text-[9px] font-black text-primary">
              {metadata.versions.length - i}
            </span>
            <div className="min-w-0 flex-1">
              <span className="block truncate text-sm font-bold text-card-foreground">
                {ver.abbr}
              </span>
            </div>
            <span className="flex-shrink-0 text-[11px] tabular-nums text-muted-foreground">
              {ver.releaseDate}
            </span>
            <ArrowRight className="h-4 w-4 text-muted-foreground opacity-0 transition-all group-hover:translate-x-0.5 group-hover:opacity-100" />
          </Link>
        ))}
      </div>
    </main>
  );
}

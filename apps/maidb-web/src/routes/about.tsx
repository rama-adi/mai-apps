import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/about")({
  component: About,
});

function About() {
  return (
    <main className="mx-auto max-w-5xl flex-1 px-4 py-12">
      <section className="rounded-xl border bg-card p-8">
        <span className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
          About
        </span>
        <h1 className="mt-2 mb-3 text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
          MaiDB — maimai Song Database
        </h1>
        <p className="m-0 max-w-3xl text-base leading-8 text-muted-foreground">
          Browse the complete maimai song catalog. Explore charts, difficulty levels, BPM, and
          version history. Built with TanStack Start, Convex, and shadcn/ui.
        </p>
      </section>
    </main>
  );
}

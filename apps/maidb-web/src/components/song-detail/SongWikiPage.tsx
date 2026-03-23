import type { MaiDbSong, Sheet } from "maidb-data";
import { DIFFICULTY_COLORS, REGION_LABELS } from "maidb-data";
import { DIFFICULTY_NAMES, TYPE_NAMES } from "maidb-data";
import { Zap, Clock, Check, X, Youtube, Share2, ClipboardCheck } from "lucide-react";
import { useState } from "react";
import { SongImage } from "./shared";

const REGION_KEYS = ["jp", "intl", "usa", "cn"] as const;

function youtubeSearchUrl(query: string) {
  return `https://www.youtube.com/results?search_query=${encodeURIComponent(query).replace(/%20/g, "+")}`;
}

export function SongWikiPage({ song }: { song: MaiDbSong }) {
  const chartTypes = [...new Set(song.sheets.map((s) => s.type))];

  const sheetsByType = new Map<string, Sheet[]>();
  for (const sheet of song.sheets) {
    const existing = sheetsByType.get(sheet.type) ?? [];
    existing.push(sheet);
    sheetsByType.set(sheet.type, existing);
  }

  // Collect region availability (union across all sheets)
  const regions = { jp: false, intl: false, usa: false, cn: false };
  for (const sheet of song.sheets) {
    for (const key of Object.keys(regions) as (keyof typeof regions)[]) {
      if (sheet.regions[key]) regions[key] = true;
    }
  }

  return (
    <div className="space-y-0">
      {/* Wiki-style header with infobox */}
      <div className="flex flex-col gap-6 sm:flex-row">
        {/* Main content */}
        <div className="min-w-0 flex-1">
          <div className="flex items-start gap-3">
            <h1 className="m-0 text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
              {song.title}
            </h1>
            {song.isNew && (
              <span className="mt-1 flex-shrink-0 rounded-full bg-primary px-2.5 py-0.5 text-xs font-bold uppercase tracking-wider text-primary-foreground">
                New
              </span>
            )}
          </div>
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
            <blockquote className="mt-3 border-l-2 border-primary/30 pl-3 text-sm italic text-muted-foreground">
              {song.comment}
            </blockquote>
          )}
        </div>

        {/* Infobox (wiki sidebar) */}
        <aside className="w-full flex-shrink-0 sm:w-56">
          <div className="overflow-hidden rounded-lg border">
            <div className="flex items-center justify-center bg-muted/50 p-3">
              <SongImage song={song} size="lg" />
            </div>
            <div className="divide-y text-sm">
              <InfoboxRow label="BPM">
                <span className="inline-flex items-center gap-1 font-semibold">
                  <Zap className="h-3 w-3 text-primary" />
                  {song.bpm}
                </span>
              </InfoboxRow>
              <InfoboxRow label="Version">
                <span className="inline-flex items-center gap-1 rounded-sm border bg-secondary px-1.5 py-0.5 text-[11px] font-medium text-secondary-foreground">
                  {song.version}
                </span>
              </InfoboxRow>
              <InfoboxRow label="Category">
                <span className="font-medium text-primary">{song.category}</span>
              </InfoboxRow>
              <InfoboxRow label="Chart Type">
                {chartTypes.map((t) => TYPE_NAMES[t] ?? t).join(", ")}
              </InfoboxRow>
              {song.releaseDate && (
                <InfoboxRow label="Release">
                  <span className="inline-flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {song.releaseDate}
                  </span>
                </InfoboxRow>
              )}
              <InfoboxRow label="Song ID">{song.songId}</InfoboxRow>
              <InfoboxRow label="Locked">{song.isLocked ? "Yes" : "No"}</InfoboxRow>
              <InfoboxRow label="Regions">
                <div className="flex flex-wrap gap-1">
                  {(Object.entries(regions) as [string, boolean][]).map(([key, available]) => (
                    <span
                      key={key}
                      className={`rounded px-1.5 py-0.5 text-[10px] font-semibold ${
                        available
                          ? "bg-primary/10 text-primary"
                          : "bg-muted text-muted-foreground line-through opacity-50"
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
      </div>

      {/* Charts section */}
      <section className="mt-8">
        <SectionHeading>Charts</SectionHeading>
        <div className="mt-4 space-y-6">
          {[...sheetsByType.entries()].map(([type, sheets]) => (
            <div key={type}>
              <h3 className="m-0 mb-3 text-base font-semibold text-foreground">
                {TYPE_NAMES[type] ?? type}
              </h3>
              <div className="overflow-x-auto rounded-lg border">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-muted/50">
                      <th className="px-3 py-2 text-left text-xs font-semibold text-muted-foreground">
                        Difficulty
                      </th>
                      <th className="px-3 py-2 text-left text-xs font-semibold text-muted-foreground">
                        Level
                      </th>
                      <th className="px-3 py-2 text-left text-xs font-semibold text-muted-foreground">
                        Internal
                      </th>
                      <th className="px-3 py-2 text-left text-xs font-semibold text-muted-foreground">
                        Notes
                      </th>
                      <th className="px-3 py-2 text-left text-xs font-semibold text-muted-foreground">
                        Designer
                      </th>
                      <th className="px-3 py-2 text-center text-xs font-semibold text-muted-foreground">
                        <span className="sr-only">YouTube</span>
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {sheets
                      .sort((a, b) => a.levelValue - b.levelValue)
                      .map((sheet, i) => {
                        const diffColor = DIFFICULTY_COLORS[sheet.difficulty] ?? "#888";
                        const diffName = DIFFICULTY_NAMES[sheet.difficulty] ?? sheet.difficulty;
                        return (
                          <tr key={i} className="border-b last:border-b-0">
                            <td className="px-3 py-2">
                              <span
                                className="inline-flex min-w-[4.5rem] items-center justify-center rounded-sm px-2 py-0.5 text-xs font-bold text-white"
                                style={{ backgroundColor: diffColor }}
                              >
                                {diffName}
                              </span>
                            </td>
                            <td className="px-3 py-2 font-semibold text-foreground">
                              {sheet.level}
                            </td>
                            <td className="px-3 py-2 text-muted-foreground">
                              {sheet.internalLevelValue > 0 ? sheet.internalLevelValue : "-"}
                            </td>
                            <td className="px-3 py-2 text-muted-foreground">
                              {sheet.noteCounts.total ?? "-"}
                            </td>
                            <td className="px-3 py-2 text-muted-foreground">
                              {sheet.noteDesigner || "-"}
                            </td>
                            <td className="px-3 py-2 text-center">
                              <a
                                href={youtubeSearchUrl(`${song.title} maimai ${diffName}`)}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex rounded p-1 text-red-500 transition-colors hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950"
                                title={`Search YouTube for ${diffName}`}
                              >
                                <Youtube className="h-4 w-4" />
                              </a>
                            </td>
                          </tr>
                        );
                      })}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Note breakdown section */}
      <section className="mt-8">
        <SectionHeading>Note Breakdown</SectionHeading>
        <div className="mt-4 space-y-6">
          {[...sheetsByType.entries()].map(([type, sheets]) => (
            <div key={type}>
              <h3 className="m-0 mb-3 text-base font-semibold text-foreground">
                {TYPE_NAMES[type] ?? type}
              </h3>
              <div className="overflow-x-auto rounded-lg border">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-muted/50">
                      <th className="px-3 py-2 text-left text-xs font-semibold text-muted-foreground">
                        Difficulty
                      </th>
                      <th className="px-3 py-2 text-center text-xs font-semibold text-muted-foreground">
                        Tap
                      </th>
                      <th className="px-3 py-2 text-center text-xs font-semibold text-muted-foreground">
                        Hold
                      </th>
                      <th className="px-3 py-2 text-center text-xs font-semibold text-muted-foreground">
                        Slide
                      </th>
                      <th className="px-3 py-2 text-center text-xs font-semibold text-muted-foreground">
                        Touch
                      </th>
                      <th className="px-3 py-2 text-center text-xs font-semibold text-muted-foreground">
                        Break
                      </th>
                      <th className="px-3 py-2 text-center text-xs font-semibold text-muted-foreground">
                        Total
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {sheets
                      .sort((a, b) => a.levelValue - b.levelValue)
                      .map((sheet, i) => {
                        const diffColor = DIFFICULTY_COLORS[sheet.difficulty] ?? "#888";
                        const diffName = DIFFICULTY_NAMES[sheet.difficulty] ?? sheet.difficulty;
                        const nc = sheet.noteCounts;
                        return (
                          <tr key={i} className="border-b last:border-b-0">
                            <td className="px-3 py-2">
                              <span
                                className="inline-flex min-w-[4.5rem] items-center justify-center rounded-sm px-2 py-0.5 text-xs font-bold text-white"
                                style={{ backgroundColor: diffColor }}
                              >
                                {diffName}
                              </span>
                            </td>
                            <td className="px-3 py-2 text-center text-muted-foreground">
                              {nc.tap ?? "-"}
                            </td>
                            <td className="px-3 py-2 text-center text-muted-foreground">
                              {nc.hold ?? "-"}
                            </td>
                            <td className="px-3 py-2 text-center text-muted-foreground">
                              {nc.slide ?? "-"}
                            </td>
                            <td className="px-3 py-2 text-center text-muted-foreground">
                              {nc.touch ?? "-"}
                            </td>
                            <td className="px-3 py-2 text-center text-muted-foreground">
                              {nc.break ?? "-"}
                            </td>
                            <td className="px-3 py-2 text-center font-semibold text-foreground">
                              {nc.total ?? "-"}
                            </td>
                          </tr>
                        );
                      })}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Region availability section */}
      <section className="mt-8">
        <SectionHeading>Region Availability</SectionHeading>
        <div className="mt-4 space-y-6">
          {[...sheetsByType.entries()].map(([type, sheets]) => (
            <div key={type}>
              <h3 className="m-0 mb-3 text-base font-semibold text-foreground">
                {TYPE_NAMES[type] ?? type}
              </h3>
              <div className="overflow-x-auto rounded-lg border">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-muted/50">
                      <th className="px-3 py-2 text-left text-xs font-semibold text-muted-foreground">
                        Difficulty
                      </th>
                      {REGION_KEYS.map((r) => (
                        <th
                          key={r}
                          className="px-3 py-2 text-center text-xs font-semibold text-muted-foreground"
                        >
                          {REGION_LABELS[r] ?? r}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {sheets
                      .sort((a, b) => a.levelValue - b.levelValue)
                      .map((sheet, i) => {
                        const diffColor = DIFFICULTY_COLORS[sheet.difficulty] ?? "#888";
                        const diffName = DIFFICULTY_NAMES[sheet.difficulty] ?? sheet.difficulty;
                        return (
                          <tr key={i} className="border-b last:border-b-0">
                            <td className="px-3 py-2">
                              <span
                                className="inline-flex min-w-[4.5rem] items-center justify-center rounded-sm px-2 py-0.5 text-xs font-bold text-white"
                                style={{ backgroundColor: diffColor }}
                              >
                                {diffName}
                              </span>
                            </td>
                            {REGION_KEYS.map((r) => (
                              <td key={r} className="px-3 py-2 text-center">
                                {sheet.regions[r] ? (
                                  <Check className="mx-auto h-4 w-4 text-green-500" />
                                ) : (
                                  <X className="mx-auto h-4 w-4 text-muted-foreground/30" />
                                )}
                              </td>
                            ))}
                          </tr>
                        );
                      })}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

function SectionHeading({ children }: { children: React.ReactNode }) {
  return (
    <div className="border-b pb-1">
      <h2 className="m-0 text-xl font-bold text-foreground">{children}</h2>
    </div>
  );
}

function InfoboxRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-2 px-3 py-2">
      <span className="text-xs font-medium text-muted-foreground">{label}</span>
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

export function SongWikiPageSkeleton() {
  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-6 sm:flex-row">
        <div className="min-w-0 flex-1 space-y-2">
          <div className="h-8 w-3/4 animate-pulse rounded bg-muted" />
          <div className="h-5 w-1/2 animate-pulse rounded bg-muted" />
        </div>
        <div className="h-64 w-full animate-pulse rounded-lg bg-muted sm:w-56" />
      </div>
      <div className="space-y-3">
        <div className="h-6 w-24 animate-pulse rounded bg-muted" />
        <div className="h-48 w-full animate-pulse rounded-lg bg-muted" />
      </div>
    </div>
  );
}

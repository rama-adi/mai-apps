import type { MaiDbSong, Sheet } from "maidb-data";
import { CATEGORY_BY_SLUG, DIFFICULTY_COLORS, REGION_LABELS, VERSION_BY_SLUG } from "maidb-data";
import { DIFFICULTY_NAMES, TYPE_NAMES } from "maidb-data";
import { Zap, Clock, Check, X, Youtube, Share2, ClipboardCheck, Lock } from "lucide-react";
import { useState } from "react";
import { SongImage } from "./shared";

const REGION_KEYS = ["jp", "intl", "usa", "cn"] as const;

function youtubeSearchUrl(query: string) {
  return `https://www.youtube.com/results?search_query=${encodeURIComponent(query).replace(/%20/g, "+")}`;
}

export function SongWikiPage({ song }: { song: MaiDbSong }) {
  const chartTypes = [...new Set(song.sheets.map((s) => s.type))];
  const catMeta = CATEGORY_BY_SLUG[song.category];
  const catColor = catMeta?.color ?? "#888";
  const verMeta = VERSION_BY_SLUG[song.version];

  const nonUtageSheets = song.sheets.filter((s) => s.type !== "utage");
  const utageSheets = song.sheets.filter((s) => s.type === "utage");
  const sheetsByType = groupSheetsByType(nonUtageSheets);

  const regions = { jp: false, intl: false, usa: false, cn: false };
  for (const sheet of song.sheets) {
    for (const key of Object.keys(regions) as (keyof typeof regions)[]) {
      if (sheet.regions[key]) regions[key] = true;
    }
  }

  return (
    <div className="space-y-0">
      {/* Header with infobox */}
      <div className="flex flex-col gap-6 sm:flex-row">
        {/* Main content */}
        <div className="min-w-0 flex-1">
          {/* Category + New badges */}
          <div className="mb-2 flex items-center gap-2">
            <span
              className="rounded px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white"
              style={{ backgroundColor: catColor }}
            >
              {catMeta?.category ?? song.category}
            </span>
            {song.isNew && (
              <span className="rounded bg-primary px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-primary-foreground">
                New
              </span>
            )}
            {song.isLocked && (
              <span className="inline-flex items-center gap-1 rounded bg-muted px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                <Lock className="h-2.5 w-2.5" /> Locked
              </span>
            )}
          </div>

          <h1 className="m-0 text-2xl font-black tracking-tight text-foreground sm:text-3xl">
            {song.title}
          </h1>
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
            <blockquote
              className="mt-3 border-l-2 pl-3 text-sm italic text-muted-foreground"
              style={{ borderLeftColor: catColor }}
            >
              {song.comment}
            </blockquote>
          )}
        </div>

        {/* Infobox sidebar */}
        <aside className="w-full flex-shrink-0 sm:w-56">
          <div
            className="overflow-hidden rounded-lg border"
            style={{ borderColor: `color-mix(in oklch, ${catColor} 25%, transparent)` }}
          >
            {/* Thumbnail with category color tint */}
            <div
              className="flex items-center justify-center p-3"
              style={{
                background: `linear-gradient(to bottom, color-mix(in oklch, ${catColor} 8%, transparent), transparent)`,
              }}
            >
              <SongImage song={song} size="lg" />
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
              <InfoboxRow label="Regions">
                <div className="flex flex-wrap gap-1">
                  {(Object.entries(regions) as [string, boolean][]).map(([key, available]) => (
                    <span
                      key={key}
                      className={`rounded px-1.5 py-0.5 text-[10px] font-bold ${
                        available
                          ? "bg-primary/10 text-primary"
                          : "bg-muted text-muted-foreground/40 line-through"
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

      {/* Charts section - with inline note breakdown */}
      <section className="mt-8">
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
                  .map((sheet, i) => {
                    const diffColor = DIFFICULTY_COLORS[sheet.difficulty] ?? "#888";
                    const diffName = DIFFICULTY_NAMES[sheet.difficulty] ?? sheet.difficulty;
                    const nc = sheet.noteCounts;
                    const hasBreakdown = nc.tap != null || nc.hold != null;
                    return (
                      <div
                        key={i}
                        className="group rounded-lg border px-3 py-2 transition-colors hover:bg-accent/30"
                        style={{ borderLeftWidth: "3px", borderLeftColor: diffColor }}
                      >
                        <div className="flex items-center gap-3">
                          <span
                            className="min-w-[4.5rem] text-xs font-bold"
                            style={{ color: diffColor }}
                          >
                            {diffName}
                          </span>
                          <span className="text-sm font-black text-foreground">{sheet.level}</span>
                          {sheet.internalLevelValue > 0 && (
                            <span className="text-xs text-muted-foreground">
                              ({sheet.internalLevelValue})
                            </span>
                          )}
                          <span className="ml-auto flex items-center gap-4 text-xs text-muted-foreground">
                            {nc.total != null && (
                              <span className="tabular-nums">{nc.total} notes</span>
                            )}
                            {sheet.noteDesigner && sheet.noteDesigner !== "-" && (
                              <span>{sheet.noteDesigner}</span>
                            )}
                            <a
                              href={youtubeSearchUrl(`${song.title} maimai ${diffName}`)}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="rounded p-1 text-muted-foreground/40 opacity-0 transition-all hover:text-red-500 group-hover:opacity-100"
                              title={`Search YouTube for ${diffName}`}
                            >
                              <Youtube className="h-3.5 w-3.5" />
                            </a>
                          </span>
                        </div>
                        {hasBreakdown && (
                          <div className="mt-1 flex gap-3 pl-[4.5rem] text-[10px] tabular-nums text-muted-foreground/50">
                            {nc.tap != null && <span>Tap {nc.tap}</span>}
                            {nc.hold != null && <span>Hold {nc.hold}</span>}
                            {nc.slide != null && <span>Slide {nc.slide}</span>}
                            {nc.touch != null && <span>Touch {nc.touch}</span>}
                            {nc.break != null && <span>Break {nc.break}</span>}
                          </div>
                        )}
                      </div>
                    );
                  })}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Utage charts section */}
      {utageSheets.length > 0 && (
        <section className="mt-8">
          <SectionHeading color={catColor}>Utage Charts</SectionHeading>
          <div className="mt-4 space-y-1">
            {utageSheets
              .sort((a, b) => a.levelValue - b.levelValue)
              .map((sheet, i) => {
                const diffColor = DIFFICULTY_COLORS[sheet.difficulty] ?? "#888";
                const diffName = DIFFICULTY_NAMES[sheet.difficulty] ?? sheet.difficulty;
                const nc = sheet.noteCounts;
                const hasBreakdown = nc.tap != null || nc.hold != null;
                return (
                  <div
                    key={i}
                    className="group rounded-lg border px-3 py-2 transition-colors hover:bg-accent/30"
                    style={{ borderLeftWidth: "3px", borderLeftColor: diffColor }}
                  >
                    <div className="flex items-center gap-3">
                      <span
                        className="min-w-[4.5rem] text-xs font-bold"
                        style={{ color: diffColor }}
                      >
                        {diffName}
                      </span>
                      <span className="text-sm font-black text-foreground">{sheet.level}</span>
                      {sheet.internalLevelValue > 0 && (
                        <span className="text-xs text-muted-foreground">
                          ({sheet.internalLevelValue})
                        </span>
                      )}
                      <span className="ml-auto flex items-center gap-4 text-xs text-muted-foreground">
                        {nc.total != null && <span className="tabular-nums">{nc.total} notes</span>}
                        {sheet.noteDesigner && sheet.noteDesigner !== "-" && (
                          <span>{sheet.noteDesigner}</span>
                        )}
                      </span>
                    </div>
                    {hasBreakdown && (
                      <div className="mt-1 flex gap-3 pl-[4.5rem] text-[10px] tabular-nums text-muted-foreground/50">
                        {nc.tap != null && <span>Tap {nc.tap}</span>}
                        {nc.hold != null && <span>Hold {nc.hold}</span>}
                        {nc.slide != null && <span>Slide {nc.slide}</span>}
                        {nc.touch != null && <span>Touch {nc.touch}</span>}
                        {nc.break != null && <span>Break {nc.break}</span>}
                      </div>
                    )}
                  </div>
                );
              })}
          </div>
        </section>
      )}

      {/* Region availability section - simplified to per-type */}
      <section className="mt-8">
        <SectionHeading color={catColor}>Region Availability</SectionHeading>
        <div className="mt-4">
          <div className="overflow-x-auto rounded-lg border">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/30">
                  <th className="px-3 py-2 text-left text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                    Type
                  </th>
                  {REGION_KEYS.map((r) => (
                    <th
                      key={r}
                      className="px-3 py-2 text-center text-[10px] font-bold uppercase tracking-wider text-muted-foreground"
                    >
                      {REGION_LABELS[r] ?? r}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[...computeTypeRegions(nonUtageSheets).entries()].map(([type, typeRegs]) => (
                  <tr key={type} className="border-b last:border-b-0">
                    <td className="px-3 py-2">
                      <span className="text-xs font-bold text-foreground">
                        {TYPE_NAMES[type] ?? type}
                      </span>
                    </td>
                    {REGION_KEYS.map((r) => (
                      <td key={r} className="px-3 py-2 text-center">
                        {typeRegs[r] ? (
                          <Check className="mx-auto h-4 w-4 text-green-500" />
                        ) : (
                          <X className="mx-auto h-4 w-4 text-muted-foreground/20" />
                        )}
                      </td>
                    ))}
                  </tr>
                ))}
                {utageSheets.length > 0 &&
                  [...computeTypeRegions(utageSheets).entries()].map(([type, typeRegs]) => (
                    <tr key={type} className="border-b last:border-b-0">
                      <td className="px-3 py-2">
                        <span className="text-xs font-bold text-foreground">
                          {TYPE_NAMES[type] ?? type}
                        </span>
                      </td>
                      {REGION_KEYS.map((r) => (
                        <td key={r} className="px-3 py-2 text-center">
                          {typeRegs[r] ? (
                            <Check className="mx-auto h-4 w-4 text-green-500" />
                          ) : (
                            <X className="mx-auto h-4 w-4 text-muted-foreground/20" />
                          )}
                        </td>
                      ))}
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>
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
          <div className="flex gap-2">
            <div className="h-5 w-20 animate-pulse rounded bg-muted" />
            <div className="h-5 w-12 animate-pulse rounded bg-muted" />
          </div>
          <div className="h-9 w-3/4 animate-pulse rounded bg-muted" />
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

/* ── Helpers ── */

function groupSheetsByType(sheets: Sheet[]) {
  const map = new Map<string, Sheet[]>();
  for (const sheet of sheets) {
    const existing = map.get(sheet.type) ?? [];
    existing.push(sheet);
    map.set(sheet.type, existing);
  }
  return map;
}

function computeTypeRegions(sheets: Sheet[]) {
  const regionKeys = ["jp", "intl", "usa", "cn"] as const;
  const map = new Map<string, Record<string, boolean>>();
  for (const sheet of sheets) {
    if (!map.has(sheet.type)) {
      map.set(sheet.type, { jp: false, intl: false, usa: false, cn: false });
    }
    const regions = map.get(sheet.type)!;
    for (const key of regionKeys) {
      if (sheet.regions[key]) regions[key] = true;
    }
  }
  return map;
}

import type { MaiDbSong, Sheet } from "maidb-data";
import { CATEGORY_BY_SLUG, DIFFICULTY_COLORS, REGION_LABELS, VERSION_BY_SLUG } from "maidb-data";
import { DIFFICULTY_NAMES, TYPE_NAMES } from "maidb-data";
import {
  Music,
  X,
  Zap,
  Check,
  X as XIcon,
  Youtube,
  Share2,
  ClipboardCheck,
  Clock,
  Lock,
  MessageCircle,
} from "lucide-react";
import { useEffect, useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@packages/ui/components/ui/tabs";

const THUMBNAIL_BASE = "https://maisongdb-blob.onebyteworks.my.id/thumb";
const REGION_KEYS = ["jp", "intl", "usa", "cn"] as const;

export function SongBrowserModal({
  isClosing,
  onClose,
  song,
}: {
  isClosing: boolean;
  onClose: () => void;
  song: MaiDbSong | null;
}) {
  useEffect(() => {
    const scrollY = window.scrollY;
    document.body.style.position = "fixed";
    document.body.style.top = `-${scrollY}px`;
    document.body.style.left = "0";
    document.body.style.right = "0";
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.position = "";
      document.body.style.top = "";
      document.body.style.left = "";
      document.body.style.right = "";
      document.body.style.overflow = "";
      window.scrollTo(0, scrollY);
    };
  }, []);

  return (
    <div
      className={`fixed inset-0 z-50 bg-black/70 backdrop-blur-sm duration-200 ${
        isClosing ? "animate-out fade-out-0" : "animate-in fade-in-0"
      }`}
      onClick={onClose}
    >
      <div
        className={`fixed left-1/2 top-1/2 z-[60] max-h-[85vh] w-[calc(100%-2rem)] max-w-lg -translate-x-1/2 -translate-y-1/2 overflow-y-auto overflow-x-hidden rounded-3xl border bg-background shadow-2xl duration-200 ${
          isClosing
            ? "animate-out zoom-out-95 slide-out-to-bottom-4 fade-out-0"
            : "animate-in zoom-in-95 slide-in-from-bottom-4"
        }`}
        onClick={(event) => event.stopPropagation()}
      >
        <button
          type="button"
          aria-label="Close song details"
          className="absolute right-3 top-3 z-10 rounded-full bg-black/40 p-1.5 text-white/80 backdrop-blur-sm transition-colors hover:bg-black/60 hover:text-white"
          onClick={onClose}
        >
          <X className="h-4 w-4" />
        </button>

        <h2 className="sr-only">{song?.title ?? "Song details"}</h2>
        {song ? <SongBrowserModalContent song={song} /> : <SongBrowserModalSkeleton />}
      </div>
    </div>
  );
}

function youtubeSearchUrl(query: string) {
  return `https://www.youtube.com/results?search_query=${encodeURIComponent(query).replace(/%20/g, "+")}`;
}

function SongBrowserModalContent({ song }: { song: MaiDbSong }) {
  const [imgError, setImgError] = useState(false);
  const thumbnailUrl = song.internalImageId
    ? `${THUMBNAIL_BASE}/${song.internalImageId}.png`
    : null;
  const catMeta = CATEGORY_BY_SLUG[song.category];
  const catColor = catMeta?.color ?? "#888";
  const verMeta = VERSION_BY_SLUG[song.version];

  const utageSheets = song.sheets.filter((s) => s.type === "utage");
  const hasUtage = utageSheets.length > 0;

  return (
    <div className="flex flex-col">
      <div
        className="relative px-5 pb-4 pt-5"
        style={{
          background: `linear-gradient(to bottom, color-mix(in oklch, ${catColor} 12%, transparent), transparent)`,
        }}
      >
        <div className="flex gap-4">
          <div
            className="flex h-28 w-28 flex-shrink-0 items-center justify-center overflow-hidden rounded-xl bg-muted shadow-lg"
            style={{ boxShadow: `0 8px 24px color-mix(in oklch, ${catColor} 20%, transparent)` }}
          >
            {thumbnailUrl && !imgError ? (
              <img
                src={thumbnailUrl}
                alt={song.title}
                className="h-full w-full object-cover"
                onError={() => setImgError(true)}
              />
            ) : (
              <Music className="h-10 w-10 text-muted-foreground" />
            )}
          </div>

          <div className="flex min-w-0 flex-1 flex-col justify-center">
            <div className="mb-1 flex items-center gap-2">
              <span
                className="rounded px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white"
                style={{ backgroundColor: catColor }}
              >
                {catMeta?.category ?? song.category}
              </span>
              {song.isNew && (
                <span className="rounded bg-primary px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-primary-foreground">
                  New
                </span>
              )}
            </div>

            <h3 className="m-0 text-xl font-bold leading-tight text-foreground">{song.title}</h3>
            <p className="m-0 mt-1 text-sm text-muted-foreground">{song.artist}</p>

            <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
              <span className="inline-flex items-center gap-1 font-semibold text-foreground">
                <Zap className="h-3 w-3 text-primary" />
                {song.bpm}
              </span>
              <span>{verMeta?.abbr ?? song.version}</span>
              {song.releaseDate && (
                <span className="inline-flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {song.releaseDate}
                </span>
              )}
              {song.isLocked && (
                <span className="inline-flex items-center gap-1 text-amber-500">
                  <Lock className="h-3 w-3" />
                  Locked
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="mt-3 flex gap-2">
          <a
            href={youtubeSearchUrl(`${song.title} ${song.artist} maimai`)}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 rounded-md bg-red-600 px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-red-700"
          >
            <Youtube className="h-3.5 w-3.5" />
            YouTube
          </a>
          {song.slug ? <ShareButton slug={song.slug} /> : null}
        </div>
      </div>

      <div className="px-5 pb-5">
        <Tabs defaultValue="overview" className="flex-col">
          <TabsList
            className={`grid h-auto w-full ${hasUtage ? "grid-cols-4" : "grid-cols-3"} rounded-xl bg-muted/60 p-1`}
          >
            <TabsTrigger value="overview" className="rounded-lg text-xs">
              Overview
            </TabsTrigger>
            <TabsTrigger value="charts" className="rounded-lg text-xs">
              Charts
            </TabsTrigger>
            <TabsTrigger value="regions" className="rounded-lg text-xs">
              Regions
            </TabsTrigger>
            {hasUtage && (
              <TabsTrigger value="utage" className="rounded-lg text-xs">
                Utage
              </TabsTrigger>
            )}
          </TabsList>

          <TabsContent value="overview" className="mt-4">
            <OverviewTab song={song} catColor={catColor} />
          </TabsContent>
          <TabsContent value="charts" className="mt-4">
            <ChartsTab song={song} />
          </TabsContent>
          <TabsContent value="regions" className="mt-4">
            <RegionsTab song={song} />
          </TabsContent>
          {hasUtage && (
            <TabsContent value="utage" className="mt-4">
              <UtageTab song={song} utageSheets={utageSheets} />
            </TabsContent>
          )}
        </Tabs>
      </div>
    </div>
  );
}

function OverviewTab({ song, catColor }: { song: MaiDbSong; catColor: string }) {
  const nonUtageSheets = song.sheets.filter((s) => s.type !== "utage");
  const sheetsByType = groupSheetsByType(nonUtageSheets);

  return (
    <div className="space-y-4">
      {/* Compact level summary */}
      <div className="space-y-2.5">
        {[...sheetsByType.entries()].map(([type, sheets]) => (
          <div key={type} className="flex items-start gap-2.5">
            <span className="mt-1 min-w-[1.75rem] text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
              {TYPE_NAMES[type] ?? type}
            </span>
            <div className="flex flex-wrap gap-1">
              {sheets
                .sort((a, b) => a.levelValue - b.levelValue)
                .map((sheet, i) => {
                  const color = DIFFICULTY_COLORS[sheet.difficulty] ?? "#888";
                  return (
                    <div
                      key={i}
                      className="flex items-center gap-1 rounded-md px-2 py-0.5"
                      style={{
                        backgroundColor: `color-mix(in oklch, ${color} 10%, transparent)`,
                      }}
                    >
                      <span className="text-[9px] font-semibold uppercase" style={{ color }}>
                        {(DIFFICULTY_NAMES[sheet.difficulty] ?? sheet.difficulty).slice(0, 3)}
                      </span>
                      <span className="text-sm font-black leading-none" style={{ color }}>
                        {sheet.level}
                      </span>
                    </div>
                  );
                })}
            </div>
          </div>
        ))}
      </div>

      {/* Region availability */}
      <div>
        <p className="m-0 mb-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
          Available in
        </p>
        <div className="flex gap-1.5">
          {REGION_KEYS.map((key) => {
            const available = song.sheets.some((sheet) => sheet.regions[key]);
            return (
              <span
                key={key}
                className={`rounded-md border px-2.5 py-1 text-[11px] font-semibold transition-colors ${
                  available
                    ? "border-primary/30 bg-primary/10 text-primary"
                    : "border-transparent bg-muted/50 text-muted-foreground/40 line-through"
                }`}
              >
                {REGION_LABELS[key] ?? key}
              </span>
            );
          })}
        </div>
      </div>

      {song.comment && (
        <p
          className="m-0 rounded-md border-l-2 bg-muted/30 px-3 py-2 text-sm italic text-muted-foreground"
          style={{ borderLeftColor: catColor }}
        >
          {song.comment}
        </p>
      )}
    </div>
  );
}

function ChartsTab({ song }: { song: MaiDbSong }) {
  const nonUtageSheets = song.sheets.filter((s) => s.type !== "utage");
  const sheetsByType = groupSheetsByType(nonUtageSheets);

  return (
    <div className="space-y-4">
      {song.isLocked && (
        <div className="flex items-center gap-2 rounded-lg border border-amber-500/20 bg-amber-500/5 px-3 py-2 text-xs text-amber-600 dark:text-amber-400">
          <Lock className="h-3.5 w-3.5 flex-shrink-0" />
          <span>This song requires certain conditions to be playable.</span>
        </div>
      )}

      {[...sheetsByType.entries()].map(([type, sheets]) => (
        <div key={type}>
          <h4 className="m-0 mb-2 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
            {TYPE_NAMES[type] ?? type}
          </h4>
          <div className="space-y-1">
            {sheets
              .sort((a, b) => a.levelValue - b.levelValue)
              .map((sheet, index) => {
                const diffName = DIFFICULTY_NAMES[sheet.difficulty] ?? sheet.difficulty;
                const diffColor = DIFFICULTY_COLORS[sheet.difficulty] ?? "#888";

                return (
                  <div
                    key={index}
                    className="group/row flex items-center gap-2 rounded-lg border px-3 py-2 transition-colors hover:bg-accent/30"
                    style={{ borderLeftColor: diffColor, borderLeftWidth: "3px" }}
                  >
                    <span className="min-w-[4rem] text-xs font-bold" style={{ color: diffColor }}>
                      {diffName}
                    </span>
                    <span className="text-sm font-black text-foreground">{sheet.level}</span>
                    {sheet.internalLevelValue > 0 && (
                      <span className="text-[11px] text-muted-foreground">
                        ({sheet.internalLevelValue})
                      </span>
                    )}
                    <span className="ml-auto truncate text-xs text-muted-foreground">
                      {sheet.noteDesigner || "?"}
                    </span>
                    <a
                      href={youtubeSearchUrl(`${song.title} maimai ${diffName}`)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="opacity-0 transition-opacity group-hover/row:opacity-100"
                      aria-label={`Search ${diffName} on YouTube`}
                    >
                      <Youtube className="h-4 w-4 text-red-500" />
                    </a>
                  </div>
                );
              })}
          </div>
        </div>
      ))}
    </div>
  );
}

function RegionsTab({ song }: { song: MaiDbSong }) {
  const nonUtageSheets = song.sheets.filter((s) => s.type !== "utage");
  const typeRegions = computeTypeRegions(nonUtageSheets);

  return (
    <div className="overflow-hidden rounded-lg border">
      <div className="grid grid-cols-[80px_repeat(4,1fr)] bg-muted/40 px-3 py-2 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
        <span>Type</span>
        {REGION_KEYS.map((region) => (
          <span key={region} className="text-center">
            {REGION_LABELS[region]}
          </span>
        ))}
      </div>
      {[...typeRegions.entries()].map(([type, regions]) => (
        <div
          key={type}
          className="grid grid-cols-[80px_repeat(4,1fr)] items-center border-t px-3 py-2.5"
        >
          <span className="text-xs font-bold text-foreground">{TYPE_NAMES[type] ?? type}</span>
          {REGION_KEYS.map((region) => (
            <span key={region} className="flex justify-center">
              {regions[region] ? (
                <Check className="h-4 w-4 text-emerald-500" />
              ) : (
                <XIcon className="h-4 w-4 text-muted-foreground/30" />
              )}
            </span>
          ))}
        </div>
      ))}
    </div>
  );
}

function UtageTab({ song, utageSheets }: { song: MaiDbSong; utageSheets: Sheet[] }) {
  return (
    <div className="space-y-4">
      <div className="space-y-1">
        {utageSheets
          .sort((a, b) => a.levelValue - b.levelValue)
          .map((sheet, i) => {
            const diffColor = DIFFICULTY_COLORS[sheet.difficulty] ?? "#888";
            const diffName = DIFFICULTY_NAMES[sheet.difficulty] ?? sheet.difficulty;

            return (
              <div
                key={i}
                className="group/row flex items-center gap-2 rounded-lg border px-3 py-2 transition-colors hover:bg-accent/30"
                style={{ borderLeftColor: diffColor, borderLeftWidth: "3px" }}
              >
                <span className="min-w-[4rem] text-xs font-bold" style={{ color: diffColor }}>
                  {diffName}
                </span>
                <span className="text-sm font-black text-foreground">{sheet.level}</span>
                {sheet.internalLevelValue > 0 && (
                  <span className="text-[11px] text-muted-foreground">
                    ({sheet.internalLevelValue})
                  </span>
                )}
                <span className="ml-auto truncate text-xs text-muted-foreground">
                  {sheet.noteDesigner || "?"}
                </span>
              </div>
            );
          })}
      </div>

      {/* Utage region availability */}
      <div>
        <p className="m-0 mb-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
          Available in
        </p>
        <div className="flex gap-1.5">
          {REGION_KEYS.map((key) => {
            const available = utageSheets.some((sheet) => sheet.regions[key]);
            return (
              <span
                key={key}
                className={`rounded-md border px-2.5 py-1 text-[11px] font-semibold ${
                  available
                    ? "border-primary/30 bg-primary/10 text-primary"
                    : "border-transparent bg-muted/50 text-muted-foreground/40 line-through"
                }`}
              >
                {REGION_LABELS[key] ?? key}
              </span>
            );
          })}
        </div>
      </div>

      {song.comment && (
        <div className="flex items-start gap-2 rounded-lg bg-muted/30 px-3 py-2.5">
          <MessageCircle className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-muted-foreground/60" />
          <p className="m-0 text-sm italic text-muted-foreground">{song.comment}</p>
        </div>
      )}
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
      className="inline-flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-xs font-semibold text-foreground transition-colors hover:bg-accent/50"
    >
      {copied ? (
        <ClipboardCheck className="h-3.5 w-3.5 text-emerald-500" />
      ) : (
        <Share2 className="h-3.5 w-3.5" />
      )}
      {copied ? "Copied" : "Copy link"}
    </button>
  );
}

function SongBrowserModalSkeleton() {
  return (
    <div className="flex flex-col p-5">
      <div className="flex gap-4">
        <div className="h-28 w-28 animate-pulse rounded-xl bg-muted" />
        <div className="flex-1 space-y-2">
          <div className="h-4 w-20 animate-pulse rounded bg-muted" />
          <div className="h-7 w-3/4 animate-pulse rounded bg-muted" />
          <div className="h-4 w-1/2 animate-pulse rounded bg-muted" />
          <div className="h-4 w-2/3 animate-pulse rounded bg-muted" />
        </div>
      </div>

      <div className="mt-4 flex gap-2">
        <div className="h-8 w-24 animate-pulse rounded-md bg-muted" />
        <div className="h-8 w-24 animate-pulse rounded-md bg-muted" />
      </div>

      <div className="mt-5">
        <div className="h-10 animate-pulse rounded-md bg-muted" />
      </div>

      <div className="mt-5 space-y-3">
        {Array.from({ length: 3 }).map((_, index) => (
          <div key={index} className="h-16 animate-pulse rounded-lg bg-muted" />
        ))}
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
  const map = new Map<string, Record<string, boolean>>();
  for (const sheet of sheets) {
    if (!map.has(sheet.type)) {
      map.set(sheet.type, { jp: false, intl: false, usa: false, cn: false });
    }
    const regions = map.get(sheet.type)!;
    for (const key of REGION_KEYS) {
      if (sheet.regions[key]) regions[key] = true;
    }
  }
  return map;
}

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
          <TabsList className="grid h-auto w-full grid-cols-3 rounded-xl bg-muted/60 p-1">
            <TabsTrigger value="overview" className="rounded-lg text-xs">
              Overview
            </TabsTrigger>
            <TabsTrigger value="difficulties" className="rounded-lg text-xs">
              Charts
            </TabsTrigger>
            <TabsTrigger value="availability" className="rounded-lg text-xs">
              Regions
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="mt-4">
            <OverviewTab song={song} catColor={catColor} />
          </TabsContent>
          <TabsContent value="difficulties" className="mt-4">
            <DifficultiesTab song={song} />
          </TabsContent>
          <TabsContent value="availability" className="mt-4">
            <AvailabilityTab song={song} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

function OverviewTab({ song, catColor }: { song: MaiDbSong; catColor: string }) {
  return (
    <div className="space-y-4">
      <LevelGrid song={song} catColor={catColor} />

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

function LevelGrid({ song, catColor }: { song: MaiDbSong; catColor: string }) {
  const sheetsByType = new Map<string, MaiDbSong["sheets"]>();
  for (const sheet of song.sheets) {
    const existing = sheetsByType.get(sheet.type) ?? [];
    existing.push(sheet);
    sheetsByType.set(sheet.type, existing);
  }

  return (
    <div className="space-y-3">
      {[...sheetsByType.entries()].map(([type, sheets]) => (
        <div key={type}>
          <div className="mb-1.5 flex items-center gap-1.5">
            <div
              className="h-px flex-1"
              style={{ backgroundColor: `color-mix(in oklch, ${catColor} 20%, transparent)` }}
            />
            <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
              {TYPE_NAMES[type] ?? type}
            </span>
            <div
              className="h-px flex-1"
              style={{ backgroundColor: `color-mix(in oklch, ${catColor} 20%, transparent)` }}
            />
          </div>
          <div className="flex flex-wrap justify-center gap-1.5">
            {sheets
              .sort((a, b) => a.levelValue - b.levelValue)
              .map((sheet, index) => {
                const color = DIFFICULTY_COLORS[sheet.difficulty] ?? "#888";
                return (
                  <div
                    key={index}
                    className="flex flex-col items-center rounded-lg px-2.5 py-1.5"
                    style={{ backgroundColor: `color-mix(in oklch, ${color} 10%, transparent)` }}
                  >
                    <span
                      className="text-[9px] font-semibold uppercase tracking-wider"
                      style={{ color }}
                    >
                      {(DIFFICULTY_NAMES[sheet.difficulty] ?? sheet.difficulty).slice(0, 3)}
                    </span>
                    <span className="text-lg font-black leading-none" style={{ color }}>
                      {sheet.level}
                    </span>
                    {sheet.internalLevelValue > 0 &&
                      sheet.internalLevelValue !== sheet.levelValue && (
                        <span className="mt-0.5 text-[9px] text-muted-foreground">
                          {sheet.internalLevelValue.toFixed(1)}
                        </span>
                      )}
                  </div>
                );
              })}
          </div>
        </div>
      ))}
    </div>
  );
}

function DifficultiesTab({ song }: { song: MaiDbSong }) {
  const sheetsByType = new Map<string, Sheet[]>();
  for (const sheet of song.sheets) {
    const existing = sheetsByType.get(sheet.type) ?? [];
    existing.push(sheet);
    sheetsByType.set(sheet.type, existing);
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 rounded-md bg-muted/50 px-3 py-2">
        <Zap className="h-4 w-4 text-primary" />
        <span className="text-sm font-semibold text-foreground">{song.bpm} BPM</span>
        {song.isLocked && (
          <span className="ml-auto inline-flex items-center gap-1 text-xs text-muted-foreground">
            <Lock className="h-3 w-3" /> Locked
          </span>
        )}
      </div>

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

function AvailabilityTab({ song }: { song: MaiDbSong }) {
  const sheetsByType = new Map<string, Sheet[]>();
  for (const sheet of song.sheets) {
    const existing = sheetsByType.get(sheet.type) ?? [];
    existing.push(sheet);
    sheetsByType.set(sheet.type, existing);
  }

  return (
    <div className="space-y-4">
      {[...sheetsByType.entries()].map(([type, sheets]) => (
        <div key={type}>
          <h4 className="m-0 mb-2 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
            {TYPE_NAMES[type] ?? type}
          </h4>
          <div className="rounded-lg border overflow-hidden">
            <div className="grid grid-cols-[96px_repeat(4,1fr)] bg-muted/40 px-3 py-2 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
              <span>Chart</span>
              {REGION_KEYS.map((region) => (
                <span key={region} className="text-center">
                  {REGION_LABELS[region]}
                </span>
              ))}
            </div>
            {sheets
              .sort((a, b) => a.levelValue - b.levelValue)
              .map((sheet, index) => {
                const diffColor = DIFFICULTY_COLORS[sheet.difficulty] ?? "#888";

                return (
                  <div
                    key={index}
                    className="grid grid-cols-[96px_repeat(4,1fr)] items-center border-t px-3 py-2 first:border-t-0"
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold" style={{ color: diffColor }}>
                        {DIFFICULTY_NAMES[sheet.difficulty] ?? sheet.difficulty}
                      </span>
                      <span className="text-sm font-black text-foreground">{sheet.level}</span>
                    </div>
                    {REGION_KEYS.map((region) => (
                      <span key={region} className="flex justify-center">
                        {sheet.regions[region] ? (
                          <Check className="h-4 w-4 text-emerald-500" />
                        ) : (
                          <XIcon className="h-4 w-4 text-muted-foreground/30" />
                        )}
                      </span>
                    ))}
                  </div>
                );
              })}
          </div>
        </div>
      ))}
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

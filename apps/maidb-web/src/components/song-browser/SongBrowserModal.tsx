import type { MaiDbSong, Sheet } from "maidb-data";
import { CATEGORY_BY_SLUG, DIFFICULTY_COLORS, REGION_LABELS, VERSION_BY_SLUG } from "maidb-data";
import { DIFFICULTY_NAMES, TYPE_NAMES } from "maidb-data";
import {
  Music,
  X,
  Zap,
  Youtube,
  Share2,
  ClipboardCheck,
  Clock,
  Lock,
  ArrowRight,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { useSongCatalog } from "../../lib/song-catalog";

const THUMBNAIL_BASE = "https://maisongdb-blob.onebyteworks.my.id/thumb";
const REGION_KEYS = ["jp", "intl", "usa", "cn"] as const;

export function SongBrowserModal({
  isClosing,
  onClose,
  onSongNavigate,
  song,
}: {
  isClosing: boolean;
  onClose: () => void;
  onSongNavigate?: (slug: string) => void;
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

  const scrollRef = useRef<HTMLDivElement>(null);

  // Scroll modal back to top when song changes
  useEffect(() => {
    scrollRef.current?.scrollTo(0, 0);
  }, [song?.slug]);

  return (
    <div
      className={`fixed inset-0 z-50 bg-black/70 backdrop-blur-sm duration-200 ${
        isClosing ? "animate-out fade-out-0" : "animate-in fade-in-0"
      }`}
      onClick={onClose}
    >
      <div
        ref={scrollRef}
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
        {song ? (
          <div key={song.slug} className="animate-in fade-in-0 duration-200">
            <SongBrowserModalContent song={song} onSongNavigate={onSongNavigate} />
          </div>
        ) : (
          <SongBrowserModalSkeleton />
        )}
      </div>
    </div>
  );
}

function youtubeSearchUrl(query: string) {
  return `https://www.youtube.com/results?search_query=${encodeURIComponent(query).replace(/%20/g, "+")}`;
}

function SongBrowserModalContent({
  song,
  onSongNavigate,
}: {
  song: MaiDbSong;
  onSongNavigate?: (slug: string) => void;
}) {
  const [imgError, setImgError] = useState(false);
  const { songs: allSongs } = useSongCatalog();
  const thumbnailUrl = song.internalImageId
    ? `${THUMBNAIL_BASE}/${song.internalImageId}.png`
    : null;
  const catMeta = CATEGORY_BY_SLUG[song.category];
  const catColor = catMeta?.color ?? "#888";
  const verMeta = VERSION_BY_SLUG[song.version];
  const isUtage = song.songId.startsWith("_utage_.");
  const nonUtageSheets = song.sheets.filter((s) => s.type !== "utage");
  const utageSheets = song.sheets.filter((s) => s.type === "utage");
  const groupedSheets = groupSheetsByType(nonUtageSheets);
  const regionAvailability = getRegionAvailability(song.sheets);
  const hasUtage = utageSheets.length > 0;

  const counterpart = useMemo(() => {
    if (!allSongs) return null;
    const counterpartId = isUtage ? song.songId.slice("_utage_.".length) : `_utage_.${song.songId}`;
    return allSongs.find((s) => s.songId === counterpartId) ?? null;
  }, [allSongs, song.songId, isUtage]);

  return (
    <div className="flex flex-col">
      <div
        className="relative px-5 pb-5 pt-5"
        style={{
          background: `linear-gradient(to bottom, color-mix(in oklch, ${catColor} 12%, transparent), transparent)`,
        }}
      >
        <div className="flex gap-4">
          <div
            className="relative flex h-24 w-24 flex-shrink-0 items-center justify-center overflow-hidden rounded-lg bg-muted shadow-lg ring-1 ring-black/5"
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
            {song.isNew && (
              <span className="absolute -right-0.5 -top-0.5 rounded-bl-md bg-primary px-1.5 py-0.5 text-[9px] font-bold uppercase leading-none tracking-wider text-primary-foreground">
                New
              </span>
            )}
          </div>

          <div className="min-w-0 flex-1 self-center">
            <div className="space-y-1.5">
              <div className="flex flex-wrap items-center gap-2">
                <span
                  className="rounded px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white"
                  style={{ backgroundColor: catColor }}
                >
                  {catMeta?.category ?? song.category}
                </span>
              </div>

              <div className="space-y-1">
                <h3 className="m-0 text-2xl font-bold leading-tight tracking-tight text-foreground">
                  {song.title}
                </h3>
                <p className="m-0 text-sm text-muted-foreground">{song.artist}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-4 space-y-3 border-t border-border/50 pt-3">
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-muted-foreground">
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

          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap gap-1.5">
              {REGION_KEYS.map((key) => (
                <span
                  key={key}
                  className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.18em] ${
                    regionAvailability[key]
                      ? "border-primary/20 bg-primary/5 text-foreground/75"
                      : "border-border/60 bg-muted/30 text-muted-foreground/40"
                  }`}
                >
                  {REGION_LABELS[key] ?? key}
                </span>
              ))}
            </div>

            <div className="flex items-center gap-2">
              <a
                href={youtubeSearchUrl(`${song.title} ${song.artist} maimai`)}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 rounded-full border border-red-500/25 bg-red-500/8 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-red-600 transition-colors hover:bg-red-500/14 dark:text-red-400"
              >
                <Youtube className="h-3 w-3" />
                YT
              </a>
              {song.slug ? <ShareButton slug={song.slug} /> : null}
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-4 px-5 pb-5">
        {counterpart && (
          <button
            type="button"
            onClick={() => onSongNavigate?.(counterpart.slug)}
            className="flex w-full items-center gap-3 rounded-lg border px-3 py-2.5 text-left transition-colors hover:bg-accent/30"
            style={{
              borderColor: isUtage
                ? `color-mix(in oklch, ${catColor} 30%, transparent)`
                : "color-mix(in oklch, #dc39b8 30%, transparent)",
              backgroundColor: isUtage ? undefined : "color-mix(in oklch, #dc39b8 5%, transparent)",
            }}
          >
            <span
              className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded text-[10px] font-bold text-white"
              style={{ backgroundColor: isUtage ? catColor : "#dc39b8" }}
            >
              {isUtage ? "♪" : "宴"}
            </span>
            <span className="min-w-0 flex-1 text-xs font-medium text-foreground">
              {isUtage ? "View regular charts" : "View utage (宴会場) charts"}
            </span>
            <ArrowRight className="h-3.5 w-3.5 flex-shrink-0 text-muted-foreground" />
          </button>
        )}
        {isUtage ? (
          <SheetSection
            title={null}
            song={song}
            groupedSheets={groupSheetsByType(utageSheets)}
            emptyText="No utage charts available."
          />
        ) : (
          <>
            <SheetSection
              title={null}
              song={song}
              groupedSheets={groupedSheets}
              emptyText="No standard charts available."
              showLockNotice={song.isLocked}
            />
            {hasUtage ? (
              <SheetSection
                title="Utage"
                song={song}
                groupedSheets={groupSheetsByType(utageSheets)}
                emptyText="No utage charts available."
                accent="secondary"
              />
            ) : null}
          </>
        )}
      </div>
    </div>
  );
}

function SheetSection({
  title,
  song,
  groupedSheets,
  emptyText,
  accent = "primary",
  showLockNotice = false,
}: {
  title: string | null;
  song: MaiDbSong;
  groupedSheets: Map<string, Sheet[]>;
  emptyText: string;
  accent?: "primary" | "secondary";
  showLockNotice?: boolean;
}) {
  const groupedEntries = [...groupedSheets.entries()];
  const toneClass = accent === "secondary" ? "rounded-lg border bg-secondary/5 p-3" : "";

  return (
    <section className={`space-y-3 ${toneClass}`}>
      {title ? <h4 className="m-0 text-sm font-semibold text-foreground">{title}</h4> : null}

      {showLockNotice ? (
        <div className="flex items-center gap-2 rounded-lg border border-amber-500/20 bg-amber-500/5 px-3 py-2 text-xs text-amber-600 dark:text-amber-400">
          <Lock className="h-3.5 w-3.5 flex-shrink-0" />
          <span>This song requires certain conditions to be playable.</span>
        </div>
      ) : null}

      {groupedEntries.length === 0 ? (
        <p className="m-0 text-sm text-muted-foreground">{emptyText}</p>
      ) : (
        <div className="space-y-3">
          {groupedEntries.map(([type, sheets]) => (
            <div
              key={type}
              className="space-y-1.5 border-t border-border/50 pt-3 first:border-t-0 first:pt-0"
            >
              <div className="flex items-center justify-between gap-3">
                <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                  {TYPE_NAMES[type] ?? type}
                </span>
                <span className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground/55">
                  {sheets.length} chart{sheets.length > 1 ? "s" : ""}
                </span>
              </div>

              <div className="space-y-1">
                {sheets
                  .sort((a, b) => a.levelValue - b.levelValue)
                  .map((sheet, index) => (
                    <SheetRow key={index} sheet={sheet} song={song} />
                  ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

function SheetRow({ sheet, song }: { sheet: Sheet; song: MaiDbSong }) {
  const diffName = DIFFICULTY_NAMES[sheet.difficulty] ?? sheet.difficulty;
  const diffColor = DIFFICULTY_COLORS[sheet.difficulty] ?? "#888";
  const nc = sheet.noteCounts;
  const hasBreakdown =
    nc.tap != null || nc.hold != null || nc.slide != null || nc.touch != null || nc.break != null;
  const designer = sheet.noteDesigner && sheet.noteDesigner !== "-" ? sheet.noteDesigner : "-";

  return (
    <div
      className="group/row rounded-lg border bg-card px-3 py-2 transition-colors hover:bg-accent/20"
      style={{ borderLeftColor: diffColor, borderLeftWidth: "3px" }}
    >
      <div className="flex items-start gap-3">
        <span
          className="min-w-[4.5rem] pt-0.5 text-xs font-bold uppercase"
          style={{ color: diffColor }}
        >
          {diffName}
        </span>
        <div className="min-w-0 flex-1 space-y-1">
          <div className="flex flex-col gap-1 sm:flex-row sm:items-baseline sm:justify-between">
            <div className="flex items-baseline gap-2">
              <span className="text-sm font-black text-foreground">{sheet.level}</span>
              {sheet.internalLevelValue > 0 ? (
                <span className="text-[11px] text-muted-foreground">
                  ({sheet.internalLevelValue})
                </span>
              ) : null}
              {nc.total != null ? (
                <span className="text-[11px] tabular-nums text-muted-foreground">
                  {nc.total} notes
                </span>
              ) : null}
            </div>
            <div className="flex items-center gap-3">
              <span className="truncate text-[11px] text-muted-foreground">{designer}</span>
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
          </div>
          {hasBreakdown ? (
            <div className="flex flex-wrap gap-x-3 gap-y-1 text-[11px] tabular-nums text-muted-foreground/80">
              {nc.tap != null ? <span>TAP {nc.tap}</span> : null}
              {nc.hold != null ? <span>HOLD {nc.hold}</span> : null}
              {nc.slide != null ? <span>SLIDE {nc.slide}</span> : null}
              {nc.touch != null ? <span>TOUCH {nc.touch}</span> : null}
              {nc.break != null ? <span>BREAK {nc.break}</span> : null}
            </div>
          ) : null}
        </div>
      </div>
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
      className="inline-flex items-center gap-1 rounded-full border border-border/70 bg-background/80 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-foreground transition-colors hover:bg-accent/50"
    >
      {copied ? (
        <ClipboardCheck className="h-3 w-3 text-emerald-500" />
      ) : (
        <Share2 className="h-3 w-3" />
      )}
      {copied ? "Copied" : "Link"}
    </button>
  );
}

function SongBrowserModalSkeleton() {
  return (
    <div className="flex flex-col p-5">
      <div className="flex gap-4">
        <div className="h-24 w-24 animate-pulse rounded-2xl bg-muted" />
        <div className="flex-1 space-y-2">
          <div className="h-4 w-20 animate-pulse rounded bg-muted" />
          <div className="h-6 w-3/4 animate-pulse rounded bg-muted" />
          <div className="h-4 w-1/2 animate-pulse rounded bg-muted" />
          <div className="h-4 w-2/3 animate-pulse rounded bg-muted" />
        </div>
      </div>

      <div className="mt-4 flex gap-2">
        <div className="h-8 w-24 animate-pulse rounded-md bg-muted" />
        <div className="h-8 w-24 animate-pulse rounded-md bg-muted" />
      </div>

      <div className="mt-5 space-y-3">
        <div className="h-20 animate-pulse rounded-2xl bg-muted" />
        <div className="h-40 animate-pulse rounded-2xl bg-muted" />
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

function getRegionAvailability(sheets: Sheet[]) {
  const regions = { jp: false, intl: false, usa: false, cn: false };
  for (const sheet of sheets) {
    for (const key of REGION_KEYS) {
      if (sheet.regions[key]) regions[key] = true;
    }
  }
  return regions;
}

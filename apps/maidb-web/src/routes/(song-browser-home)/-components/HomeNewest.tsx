import { Link } from "@tanstack/react-router";
import { ArrowUpRight, Sparkles } from "lucide-react";
import type { MouseEvent } from "react";
import type { MaiDbSong } from "maidb-data";
import { CATEGORY_BY_SLUG, DIFFICULTY_COLORS, DIFFICULTY_NAMES, VERSION_BY_SLUG } from "maidb-data";
import { HomeSectionHeader } from "./HomeSectionHeader";

const THUMBNAIL_BASE = "https://maisongdb-blob.onebyteworks.my.id/thumb";

interface HomeNewestProps {
  songs: MaiDbSong[];
  onSongSelect: (song: MaiDbSong) => void;
}

interface PeakChart {
  difficulty: string;
  level: string;
}

function getPeakChart(song: MaiDbSong): PeakChart | null {
  if (!song.sheets.length) return null;
  const top = song.sheets.reduce((best, current) =>
    current.levelValue > best.levelValue ? current : best,
  );
  return { difficulty: top.difficulty, level: top.level };
}

function shouldInterceptClick(event: MouseEvent): boolean {
  return (
    !event.defaultPrevented &&
    event.button === 0 &&
    !event.metaKey &&
    !event.ctrlKey &&
    !event.shiftKey &&
    !event.altKey
  );
}

export function HomeNewest({ songs, onSongSelect }: HomeNewestProps) {
  const featured = songs.slice(0, 8);
  if (!featured.length) return null;

  const [lead, ...rest] = featured;

  return (
    <section className="relative mt-14">
      <HomeSectionHeader
        title="Newest"
        description="Recently added songs and freshly charted updates."
        icon={<Sparkles className="h-4 w-4 text-primary" />}
        link={{ label: "View all", to: "/songs", search: { isNew: true } }}
      />

      <div className="border border-border bg-card">
        {lead ? <FeaturedRow song={lead} onSelect={onSongSelect} /> : null}
        {rest.length ? (
          <ul className="m-0 list-none divide-y divide-border border-t border-border p-0">
            {rest.map((song) => (
              <li key={song.songId} className="m-0 p-0">
                <CompactRow song={song} onSelect={onSongSelect} />
              </li>
            ))}
          </ul>
        ) : null}
      </div>
    </section>
  );
}

function FeaturedRow({ song, onSelect }: { song: MaiDbSong; onSelect: (song: MaiDbSong) => void }) {
  const peak = getPeakChart(song);
  const thumb = song.internalImageId ? `${THUMBNAIL_BASE}/${song.internalImageId}.png` : null;
  const versionName = VERSION_BY_SLUG[song.version]?.version ?? song.version;
  const categoryName = CATEGORY_BY_SLUG[song.category]?.category ?? song.category;

  const handleClick = (event: MouseEvent<HTMLAnchorElement>) => {
    if (!song.slug || !shouldInterceptClick(event)) return;
    event.preventDefault();
    onSelect(song);
  };

  return (
    <Link
      to="/songs/$slug"
      params={{ slug: song.slug }}
      resetScroll={false}
      onClick={handleClick}
      className="group relative grid w-full grid-cols-[auto_1fr_auto] items-center gap-5 px-5 py-5 text-left transition-colors duration-300 hover:bg-accent/40 sm:gap-6 sm:px-6 sm:py-6"
    >
      <span
        aria-hidden
        className="pointer-events-none absolute left-0 top-0 h-full w-1 origin-bottom scale-y-0 bg-primary transition-transform duration-300 group-hover:scale-y-100"
      />
      <div className="relative h-20 w-20 flex-shrink-0 overflow-hidden border border-border bg-muted sm:h-24 sm:w-24">
        {thumb ? (
          <img
            src={thumb}
            alt=""
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : null}
      </div>
      <div className="min-w-0">
        <div className="mb-1.5 flex items-center gap-2">
          {song.isNew ? (
            <span className="inline-flex items-center border border-primary/40 bg-primary/10 px-1.5 py-0.5 font-mono text-[10px] font-black uppercase tracking-[0.18em] text-primary">
              New
            </span>
          ) : null}
          <span className="font-mono text-[10px] tabular-nums tracking-wide text-muted-foreground">
            {song.releaseDate}
          </span>
        </div>
        <p className="m-0 truncate text-lg font-black tracking-tight text-foreground sm:text-xl">
          {song.title}
        </p>
        <p className="mt-0.5 truncate text-xs text-muted-foreground sm:text-sm">{song.artist}</p>
        <div className="mt-2.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] font-bold uppercase tracking-wide text-muted-foreground">
          <span className="text-foreground/70">{versionName}</span>
          <span aria-hidden className="text-border">
            /
          </span>
          <span className="font-mono tabular-nums">{song.bpm} BPM</span>
          <span aria-hidden className="text-border">
            /
          </span>
          <span>{categoryName}</span>
        </div>
      </div>
      <div className="flex flex-col items-end gap-3">
        {peak ? <DifficultyChip peak={peak} /> : null}
        <ArrowUpRight className="h-4 w-4 -translate-x-1 text-muted-foreground opacity-0 transition-all duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0 group-hover:text-primary group-hover:opacity-100" />
      </div>
    </Link>
  );
}

function CompactRow({ song, onSelect }: { song: MaiDbSong; onSelect: (song: MaiDbSong) => void }) {
  const peak = getPeakChart(song);
  const thumb = song.internalImageId ? `${THUMBNAIL_BASE}/${song.internalImageId}.png` : null;
  const versionAbbr = VERSION_BY_SLUG[song.version]?.abbr ?? song.version;

  const handleClick = (event: MouseEvent<HTMLAnchorElement>) => {
    if (!song.slug || !shouldInterceptClick(event)) return;
    event.preventDefault();
    onSelect(song);
  };

  return (
    <Link
      to="/songs/$slug"
      params={{ slug: song.slug }}
      resetScroll={false}
      onClick={handleClick}
      className="group relative grid w-full grid-cols-[auto_1fr_auto_auto] items-center gap-3 px-4 py-3 text-left transition-colors duration-300 hover:bg-accent/40 sm:gap-4 sm:px-5"
    >
      <span
        aria-hidden
        className="pointer-events-none absolute left-0 top-0 h-full w-0.5 origin-bottom scale-y-0 bg-primary transition-transform duration-300 group-hover:scale-y-100"
      />
      <div className="relative h-10 w-10 flex-shrink-0 overflow-hidden border border-border bg-muted sm:h-11 sm:w-11">
        {thumb ? (
          <img
            src={thumb}
            alt=""
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
          />
        ) : null}
      </div>
      <div className="min-w-0">
        <p className="m-0 truncate text-sm font-bold text-foreground">{song.title}</p>
        <p className="mt-0.5 truncate text-[11px] text-muted-foreground">{song.artist}</p>
      </div>
      <div className="hidden items-center gap-3 text-[10px] font-bold uppercase tracking-wide text-muted-foreground sm:flex">
        <span className="font-mono tabular-nums">{song.releaseDate}</span>
        <span aria-hidden className="text-border">
          /
        </span>
        <span className="text-foreground/70">{versionAbbr}</span>
      </div>
      {peak ? <DifficultyChip peak={peak} compact /> : <span />}
    </Link>
  );
}

function DifficultyChip({ peak, compact = false }: { peak: PeakChart; compact?: boolean }) {
  const color = DIFFICULTY_COLORS[peak.difficulty] ?? "var(--primary)";
  const label = DIFFICULTY_NAMES[peak.difficulty] ?? peak.difficulty;
  return (
    <span
      className={
        compact
          ? "inline-flex items-center gap-1.5 border px-1.5 py-0.5 text-[10px] font-black tabular-nums"
          : "inline-flex items-center gap-2 border px-2 py-1 text-[10px] font-black tabular-nums"
      }
      style={{
        borderColor: `color-mix(in oklch, ${color} 50%, transparent)`,
        backgroundColor: `color-mix(in oklch, ${color} 10%, transparent)`,
        color,
      }}
    >
      <span aria-hidden className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: color }} />
      <span className="font-mono">{peak.level}</span>
      {compact ? null : <span className="hidden tracking-wider sm:inline">{label}</span>}
    </span>
  );
}

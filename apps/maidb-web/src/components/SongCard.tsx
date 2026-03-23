import { useLocation, useNavigate } from "@tanstack/react-router";
import { Music } from "lucide-react";
import { useState } from "react";
import { CATEGORY_BY_SLUG, DIFFICULTY_COLORS, VERSION_BY_SLUG, type MaiDbSong } from "maidb-data";

const THUMBNAIL_BASE = "https://maisongdb-blob.onebyteworks.my.id/thumb";

const DIFF_ORDER = ["basic", "advanced", "expert", "master", "remaster"];

function getTopDifficulties(song: MaiDbSong) {
  const best = new Map<string, string>();
  for (const s of song.sheets) {
    if (s.type === "utage" || s.isSpecial) continue;
    if (!best.has(s.difficulty) || s.levelValue > (Number(best.get(s.difficulty)) || 0)) {
      best.set(s.difficulty, s.level);
    }
  }
  return DIFF_ORDER.filter((d) => best.has(d)).map((d) => ({
    difficulty: d,
    level: best.get(d)!,
    color: DIFFICULTY_COLORS[d] ?? "#888",
  }));
}

export function SongCard({ song, openInModal = true }: { song: MaiDbSong; openInModal?: boolean }) {
  const [imgError, setImgError] = useState(false);
  const navigate = useNavigate();
  const search = useLocation({ select: (location) => location.search });
  const thumbnailUrl = song.internalImageId
    ? `${THUMBNAIL_BASE}/${song.internalImageId}.png`
    : null;
  const catColor = CATEGORY_BY_SLUG[song.category]?.color ?? "#888";
  const diffs = getTopDifficulties(song);

  const handleClick = () => {
    if (!song.slug) return;
    if (openInModal) {
      void navigate({
        to: "/song-modal/$slug",
        params: { slug: song.slug },
        search: search,
        resetScroll: false,
        mask: { to: "/songs/$slug", params: { slug: song.slug }, unmaskOnReload: true },
      });
      return;
    }

    void navigate({
      to: "/songs/$slug",
      params: { slug: song.slug },
      search: search,
      resetScroll: false,
    });
  };

  return (
    <article
      className="group relative flex cursor-pointer flex-col overflow-hidden rounded-lg border bg-card transition-all hover:shadow-md"
      style={{ borderColor: `color-mix(in oklch, ${catColor} 25%, transparent)` }}
      onClick={handleClick}
    >
      {/* Category accent strip */}
      <div className="h-0.5" style={{ backgroundColor: catColor }} />

      <div className="flex gap-3 p-3">
        {/* Thumbnail */}
        <div className="relative flex h-16 w-16 flex-shrink-0 items-center justify-center overflow-hidden rounded-md bg-muted">
          {thumbnailUrl && !imgError ? (
            <img
              src={thumbnailUrl}
              alt={song.title}
              className="h-full w-full object-cover transition-transform duration-200 group-hover:scale-105"
              loading="lazy"
              onError={() => setImgError(true)}
            />
          ) : (
            <Music className="h-6 w-6 text-muted-foreground" />
          )}
          {song.isNew && (
            <span className="absolute -right-0.5 -top-0.5 rounded-bl-md bg-primary px-1.5 py-0.5 text-[9px] font-bold uppercase leading-none tracking-wider text-primary-foreground">
              New
            </span>
          )}
        </div>

        {/* Info */}
        <div className="flex min-w-0 flex-1 flex-col justify-between">
          <div>
            <h3 className="m-0 truncate text-sm font-bold leading-tight text-card-foreground">
              {song.title}
            </h3>
            <p className="m-0 mt-0.5 truncate text-xs text-muted-foreground">{song.artist}</p>
          </div>

          {/* Difficulty chips — the most useful info at a glance */}
          <div className="mt-1.5 flex items-center gap-1">
            {diffs.map((d) => (
              <span
                key={d.difficulty}
                className="inline-flex min-w-[1.75rem] items-center justify-center rounded px-1 py-[1px] text-[10px] font-bold leading-tight text-white"
                style={{ backgroundColor: d.color }}
                title={d.difficulty}
              >
                {d.level}
              </span>
            ))}
            <span className="ml-auto text-[10px] text-muted-foreground">
              {VERSION_BY_SLUG[song.version]?.abbr ?? song.version}
            </span>
          </div>
        </div>
      </div>
    </article>
  );
}

export function SongCardSkeleton() {
  return (
    <div className="flex flex-col overflow-hidden rounded-lg border bg-card">
      <div className="h-0.5 bg-muted" />
      <div className="flex gap-3 p-3">
        <div className="h-16 w-16 flex-shrink-0 animate-pulse rounded-md bg-muted" />
        <div className="flex min-w-0 flex-1 flex-col justify-between">
          <div>
            <div className="h-[18px] w-3/4 animate-pulse rounded bg-muted" />
            <div className="mt-1 h-[14px] w-1/2 animate-pulse rounded bg-muted" />
          </div>
          <div className="mt-1.5 flex gap-1">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-[18px] w-7 animate-pulse rounded bg-muted" />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

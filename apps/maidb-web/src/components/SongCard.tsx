import { useNavigate } from "@tanstack/react-router";
import { Music, Clock, Zap } from "lucide-react";
import { useState } from "react";

const THUMBNAIL_BASE = "https://maisongdb-blob.onebyteworks.my.id/thumb";

interface SongCardProps {
  slug: string | null;
  title: string;
  artist: string;
  bpm: number | null;
  version: { version: string; abbr: string } | null;
  category: string | null;
  isNew: boolean;
  releaseDate: string | null;
  imageName: string;
  internalImageId: string | null;
}

// Fixed height so skeletons and real cards are identical size — no layout shift
const cardClass =
  "group flex h-full w-full gap-4 rounded-lg border bg-card p-4 transition-colors hover:bg-accent/50 cursor-pointer";
const thumbClass =
  "flex h-14 w-14 flex-shrink-0 items-center justify-center overflow-hidden rounded-md bg-muted";

export function SongCard({
  slug,
  title,
  artist,
  bpm,
  version,
  category,
  isNew,
  releaseDate,
  internalImageId,
}: SongCardProps) {
  const [imgError, setImgError] = useState(false);
  const navigate = useNavigate();
  const thumbnailUrl = internalImageId ? `${THUMBNAIL_BASE}/${internalImageId}.png` : null;

  const handleClick = () => {
    if (!slug) return;
    void navigate({
      to: "/",
      search: (prev: Record<string, unknown>) => ({ ...prev, songSlug: slug }),
      mask: { to: "/songs/$slug", params: { slug } },
    });
  };

  return (
    <article className={cardClass} onClick={handleClick}>
      <div className={thumbClass}>
        {thumbnailUrl && !imgError ? (
          <img
            src={thumbnailUrl}
            alt={title}
            className="h-full w-full object-cover"
            loading="lazy"
            onError={() => setImgError(true)}
          />
        ) : (
          <Music className="h-6 w-6 text-muted-foreground" />
        )}
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-start gap-2">
          <h3 className="m-0 truncate text-sm font-semibold text-card-foreground">{title}</h3>
          {isNew && (
            <span className="flex-shrink-0 rounded-full bg-primary px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-primary-foreground">
              New
            </span>
          )}
        </div>
        <p className="m-0 mt-0.5 truncate text-xs text-muted-foreground">{artist}</p>

        <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-muted-foreground">
          {bpm != null && (
            <span className="inline-flex items-center gap-1">
              <Zap className="h-3 w-3" />
              {bpm} BPM
            </span>
          )}
          {version && (
            <span className="inline-flex items-center gap-1 rounded-sm border bg-secondary px-1.5 py-0.5 text-[10px] font-medium text-secondary-foreground">
              {version.abbr}
            </span>
          )}
          {category && (
            <span className="inline-flex items-center gap-1 font-medium text-primary">
              {category}
            </span>
          )}
          {releaseDate && (
            <span className="inline-flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {releaseDate}
            </span>
          )}
        </div>
      </div>
    </article>
  );
}

export function SongCardSkeleton() {
  return (
    <div className="flex h-full w-full gap-4 rounded-lg border bg-card p-4">
      <div className="h-14 w-14 flex-shrink-0 animate-pulse rounded-md bg-muted" />
      <div className="min-w-0 flex-1">
        {/* Title + badge row */}
        <div className="flex items-start gap-2">
          <div className="h-[20px] w-3/4 animate-pulse rounded bg-muted" />
          <div className="h-[20px] w-10 flex-shrink-0 animate-pulse rounded-full bg-muted" />
        </div>
        {/* Artist row */}
        <div className="mt-0.5 h-[16px] w-1/2 animate-pulse rounded bg-muted" />
        {/* Metadata row: BPM + version + category + date */}
        <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1">
          <div className="h-[17px] w-16 animate-pulse rounded bg-muted" />
          <div className="h-[21px] w-14 animate-pulse rounded-sm bg-muted" />
          <div className="h-[17px] w-20 animate-pulse rounded bg-muted" />
          <div className="h-[17px] w-24 animate-pulse rounded bg-muted" />
        </div>
      </div>
    </div>
  );
}

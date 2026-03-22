import { Music, Zap, Clock, ExternalLink } from "lucide-react";
import { useState } from "react";
import type { MaiDbSong, Sheet } from "maidb-data";
import { DIFFICULTY_COLORS } from "maidb-data";
import { DIFFICULTY_NAMES, TYPE_NAMES } from "../lib/songs";

const THUMBNAIL_BASE = "https://maisongdb-blob.onebyteworks.my.id/thumb";

export function SongDetail({
  song,
  showFullPageLink = true,
}: {
  song: MaiDbSong;
  showFullPageLink?: boolean;
}) {
  const [imgError, setImgError] = useState(false);
  const thumbnailUrl = song.internalImageId
    ? `${THUMBNAIL_BASE}/${song.internalImageId}.png`
    : null;

  // Group sheets by type
  const sheetsByType = new Map<string, Sheet[]>();
  for (const sheet of song.sheets) {
    const key = TYPE_NAMES[sheet.type] ?? sheet.type;
    const existing = sheetsByType.get(key) ?? [];
    existing.push(sheet);
    sheetsByType.set(key, existing);
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex gap-4">
        <div className="flex h-20 w-20 flex-shrink-0 items-center justify-center overflow-hidden rounded-lg bg-muted">
          {thumbnailUrl && !imgError ? (
            <img
              src={thumbnailUrl}
              alt={song.title}
              className="h-full w-full object-cover"
              onError={() => setImgError(true)}
            />
          ) : (
            <Music className="h-8 w-8 text-muted-foreground" />
          )}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-start gap-2">
            <h2 className="m-0 text-lg font-bold text-foreground">{song.title}</h2>
            {song.isNew && (
              <span className="flex-shrink-0 rounded-full bg-primary px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-primary-foreground">
                New
              </span>
            )}
          </div>
          <p className="m-0 mt-0.5 text-sm text-muted-foreground">{song.artist}</p>
          <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1">
              <Zap className="h-3 w-3" />
              {song.bpm} BPM
            </span>
            <span className="inline-flex items-center gap-1 rounded-sm border bg-secondary px-1.5 py-0.5 text-[10px] font-medium text-secondary-foreground">
              {song.version}
            </span>
            <span className="font-medium text-primary">{song.category}</span>
            {song.releaseDate && (
              <span className="inline-flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {song.releaseDate}
              </span>
            )}
          </div>
        </div>
      </div>

      {song.comment && <p className="m-0 text-sm italic text-muted-foreground">{song.comment}</p>}

      {/* Charts */}
      {[...sheetsByType.entries()].map(([typeName, sheets]) => (
        <div key={typeName}>
          <h3 className="m-0 mb-3 text-sm font-semibold text-foreground">{typeName}</h3>
          <div className="space-y-2">
            {sheets
              .sort((a, b) => a.levelValue - b.levelValue)
              .map((sheet, i) => (
                <SheetRow key={i} sheet={sheet} />
              ))}
          </div>
        </div>
      ))}

      {/* Full page link (shown in modal) */}
      {showFullPageLink && song.slug && (
        <a
          href={`/songs/${song.slug}`}
          className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
        >
          View full page
          <ExternalLink className="h-3.5 w-3.5" />
        </a>
      )}
    </div>
  );
}

function SheetRow({ sheet }: { sheet: Sheet }) {
  const diffColor = DIFFICULTY_COLORS[sheet.difficulty] ?? "#888";
  const diffName = DIFFICULTY_NAMES[sheet.difficulty] ?? sheet.difficulty;

  return (
    <div className="flex items-center gap-3 rounded-md border bg-card px-3 py-2">
      <span
        className="inline-flex min-w-[4.5rem] items-center justify-center rounded-sm px-2 py-0.5 text-xs font-bold text-white"
        style={{ backgroundColor: diffColor }}
      >
        {diffName}
      </span>
      <span className="text-sm font-semibold text-foreground">{sheet.level}</span>
      {sheet.internalLevel && (
        <span className="text-xs text-muted-foreground">({sheet.internalLevel})</span>
      )}
      {sheet.noteDesigner && (
        <span className="ml-auto text-xs text-muted-foreground">{sheet.noteDesigner}</span>
      )}
      {sheet.noteCounts.total != null && (
        <span className="text-xs text-muted-foreground">{sheet.noteCounts.total} notes</span>
      )}
    </div>
  );
}

export function SongDetailSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex gap-4">
        <div className="h-20 w-20 flex-shrink-0 animate-pulse rounded-lg bg-muted" />
        <div className="min-w-0 flex-1 space-y-2">
          <div className="h-6 w-3/4 animate-pulse rounded bg-muted" />
          <div className="h-4 w-1/2 animate-pulse rounded bg-muted" />
          <div className="h-4 w-2/3 animate-pulse rounded bg-muted" />
        </div>
      </div>
      <div className="space-y-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-10 animate-pulse rounded-md bg-muted" />
        ))}
      </div>
    </div>
  );
}

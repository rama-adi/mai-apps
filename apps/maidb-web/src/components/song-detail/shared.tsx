import { Music } from "lucide-react";
import { useState } from "react";
import type { MaiDbSong } from "maidb-data";

const THUMBNAIL_BASE = "https://maisongdb-blob.onebyteworks.my.id/thumb";

export function SongImage({
  song,
  size = "md",
}: {
  song: MaiDbSong;
  size?: "sm" | "md" | "lg" | "full";
}) {
  const [imgError, setImgError] = useState(false);
  const thumbnailUrl = song.internalImageId
    ? `${THUMBNAIL_BASE}/${song.internalImageId}.png`
    : null;

  const sizeClass = {
    sm: "h-14 w-14",
    md: "h-20 w-20",
    lg: "h-32 w-32",
    full: "w-full aspect-square",
  }[size];

  const iconSize = {
    sm: "h-6 w-6",
    md: "h-8 w-8",
    lg: "h-12 w-12",
    full: "h-12 w-12",
  }[size];

  return (
    <div
      className={`${sizeClass} flex flex-shrink-0 items-center justify-center overflow-hidden rounded-lg bg-muted`}
    >
      {thumbnailUrl && !imgError ? (
        <img
          src={thumbnailUrl}
          alt={song.title}
          className="h-full w-full object-cover"
          onError={() => setImgError(true)}
        />
      ) : (
        <Music className={`${iconSize} text-muted-foreground`} />
      )}
    </div>
  );
}

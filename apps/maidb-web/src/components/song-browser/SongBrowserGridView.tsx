import { useEffect, useRef } from "react";
import { Music } from "lucide-react";
import type { MaiDbSong } from "maidb-data";
import { SongCard, SongCardSkeleton } from "../SongCard";
import { useSongBrowser } from "./SongBrowser";

export function SongBrowserGridView({
  emptyDescription = "Database is empty.",
  emptyTitle = "No songs found",
  onSongSelect,
}: {
  emptyDescription?: string;
  emptyTitle?: string;
  onSongSelect?: (song: MaiDbSong, trigger?: HTMLElement | null) => void;
}) {
  const { canLoadMore, isFiltered, isLoading, loadMore, songs, totalCount } = useSongBrowser();
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  const isAdvancingRef = useRef(false);
  const songCount = songs?.length ?? 0;

  useEffect(() => {
    isAdvancingRef.current = false;
  }, [songCount]);

  useEffect(() => {
    if (!canLoadMore || !sentinelRef.current) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const isIntersecting = entries.some((entry) => entry.isIntersecting);
        if (!isIntersecting) {
          isAdvancingRef.current = false;
          return;
        }

        if (!isAdvancingRef.current) {
          isAdvancingRef.current = true;
          loadMore();
        }
      },
      { rootMargin: "320px 0px" },
    );

    observer.observe(sentinelRef.current);
    return () => observer.disconnect();
  }, [canLoadMore, loadMore, songCount]);

  return (
    <section className="mt-4">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {isLoading
          ? Array.from({ length: 12 }).map((_, index) => <SongCardSkeleton key={index} />)
          : songs && songs.length > 0
            ? songs.map((song) => (
                <SongCard key={song.songId} song={song} onSelect={onSongSelect} />
              ))
            : null}
      </div>

      {canLoadMore && <div ref={sentinelRef} className="h-10" aria-hidden="true" />}

      {!isLoading && totalCount === 0 && (
        <div className="flex flex-col items-center justify-center rounded-lg border bg-card py-16 text-center">
          <Music className="mb-4 h-12 w-12 text-muted-foreground/40" />
          <p className="m-0 text-lg font-bold text-foreground">
            {isFiltered ? "No songs match" : emptyTitle}
          </p>
          <p className="m-0 mt-1 text-sm text-muted-foreground">
            {isFiltered ? "Try different search terms or filters." : emptyDescription}
          </p>
        </div>
      )}
    </section>
  );
}

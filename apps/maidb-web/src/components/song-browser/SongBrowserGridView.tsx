import { useCallback, useEffect, useRef } from "react";
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
  const { canLoadMore, isFiltered, isLoading, loadMore, songs, totalCount, useChartConstant } =
    useSongBrowser();
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  const loadingRef = useRef(false);

  const handleLoadMore = useCallback(() => {
    if (loadingRef.current) return;
    loadingRef.current = true;
    loadMore();
    // Allow next load after a short debounce
    requestAnimationFrame(() => {
      loadingRef.current = false;
    });
  }, [loadMore]);

  useEffect(() => {
    loadingRef.current = false;
  }, [songs?.length]);

  useEffect(() => {
    if (!canLoadMore || !sentinelRef.current) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          handleLoadMore();
        }
      },
      { rootMargin: "400px 0px" },
    );

    observer.observe(sentinelRef.current);
    return () => observer.disconnect();
  }, [canLoadMore, handleLoadMore]);

  return (
    <section className="mt-4">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {isLoading
          ? Array.from({ length: 12 }).map((_, index) => <SongCardSkeleton key={index} />)
          : songs && songs.length > 0
            ? songs.map((song) => (
                <SongCard
                  key={song.songId}
                  song={song}
                  onSelect={onSongSelect}
                  useChartConstant={useChartConstant}
                />
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

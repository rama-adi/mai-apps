import { useCallback, useEffect, useRef } from "react";
import { Music } from "lucide-react";
import type { MaiDbSong } from "maidb-data";
import { SongCard, SongCardSkeleton } from "../SongCard";
import { useSongBrowser } from "./SongBrowser";

const AUTO_FILL_PRELOAD_PX = 240;

export function SongBrowserGridView({
  emptyDescription = "Database is empty.",
  emptyTitle = "No songs found",
  onSongSelect,
}: {
  emptyDescription?: string;
  emptyTitle?: string;
  onSongSelect?: (song: MaiDbSong, trigger?: HTMLElement | null) => void;
}) {
  const {
    canLoadMore,
    search,
    isFiltered,
    isLoading,
    loadMore,
    maxInternalLevel,
    maxLevel,
    minInternalLevel,
    minLevel,
    pageSize,
    songs,
    totalCount,
    useChartConstant,
  } = useSongBrowser();
  const gridRef = useRef<HTMLDivElement | null>(null);
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  const loadingRef = useRef(false);

  const handleLoadMore = useCallback(
    (pageCount = 1) => {
      if (loadingRef.current) return;
      loadingRef.current = true;
      loadMore(pageCount);
    },
    [loadMore],
  );

  const fillViewportIfNeeded = useCallback(() => {
    if (loadingRef.current) return;
    if (!canLoadMore || !gridRef.current || !sentinelRef.current) return;

    const firstCard = gridRef.current.firstElementChild;
    if (!(firstCard instanceof HTMLElement)) return;

    const gridStyles = window.getComputedStyle(gridRef.current);
    const rowGap = Number.parseFloat(gridStyles.rowGap || gridStyles.gap || "0") || 0;
    const columnCount = Math.max(
      1,
      gridStyles.gridTemplateColumns.split(" ").filter(Boolean).length,
    );
    const rowHeight = firstCard.getBoundingClientRect().height + rowGap;
    if (rowHeight <= 0) return;

    const sentinelTop = sentinelRef.current.getBoundingClientRect().top;
    const missingHeight = window.innerHeight + AUTO_FILL_PRELOAD_PX - sentinelTop;
    if (missingHeight <= 0) return;

    const rowsNeeded = Math.ceil(missingHeight / rowHeight);
    const pagesNeeded = Math.max(1, Math.ceil((rowsNeeded * columnCount) / pageSize));
    handleLoadMore(pagesNeeded);
  }, [canLoadMore, handleLoadMore, pageSize]);

  useEffect(() => {
    loadingRef.current = false;
  }, [songs?.length]);

  useEffect(() => {
    if (isLoading) return;
    fillViewportIfNeeded();
  }, [fillViewportIfNeeded, isLoading, songs?.length]);

  useEffect(() => {
    if (!canLoadMore || !sentinelRef.current) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          fillViewportIfNeeded();
        }
      },
      { rootMargin: `${AUTO_FILL_PRELOAD_PX}px 0px` },
    );

    observer.observe(sentinelRef.current);
    return () => observer.disconnect();
  }, [canLoadMore, fillViewportIfNeeded]);

  return (
    <section className="mt-4">
      <div
        ref={gridRef}
        className="grid w-full gap-3 sm:grid-cols-[repeat(2,minmax(0,1fr))] lg:grid-cols-[repeat(3,minmax(0,1fr))]"
      >
        {isLoading
          ? Array.from({ length: 12 }).map((_, index) => <SongCardSkeleton key={index} />)
          : songs && songs.length > 0
            ? songs.map((song) => (
                <SongCard
                  key={song.songId}
                  song={song}
                  onSelect={onSongSelect}
                  useChartConstant={useChartConstant}
                  difficulty={search.difficulty}
                  type={search.type}
                  region={search.region}
                  minLevel={minLevel}
                  maxLevel={maxLevel}
                  minInternalLevel={minInternalLevel}
                  maxInternalLevel={maxInternalLevel}
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

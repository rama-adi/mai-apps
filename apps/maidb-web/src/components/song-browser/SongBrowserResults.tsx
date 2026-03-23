import type { MaiDbSong } from "maidb-data";
import { useSongBrowser } from "./SongBrowser";

export type SongBrowserResultsRenderProps = {
  activeFilterCount: number;
  canLoadMore: boolean;
  isFiltered: boolean;
  isLoading: boolean;
  loadMore: () => void;
  songs?: MaiDbSong[];
  totalCount?: number;
};

export function SongBrowserResults({
  children,
}: {
  children: (props: SongBrowserResultsRenderProps) => React.ReactNode;
}) {
  const { activeFilterCount, canLoadMore, isFiltered, isLoading, loadMore, songs, totalCount } =
    useSongBrowser();

  return children({
    activeFilterCount,
    canLoadMore,
    isFiltered,
    isLoading,
    loadMore,
    songs,
    totalCount,
  });
}

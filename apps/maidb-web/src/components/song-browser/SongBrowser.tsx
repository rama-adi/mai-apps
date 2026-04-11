import {
  createContext,
  startTransition,
  useContext,
  useDeferredValue,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { filterSongs, type MaiDbSong, type SongFilters } from "maidb-data";
import { useSongCatalog } from "../../lib/song-catalog";
import type { SongBrowserFilterOptions, SongBrowserSearchParams } from "./song-browser.types";

type SongBrowserPaginationMode = "infinite" | "all";

type SongBrowserContextValue = {
  activeFilterCount: number;
  canLoadMore: boolean;
  filterOptions?: SongBrowserFilterOptions;
  isFiltered: boolean;
  isLoading: boolean;
  loadMore: (pageCount?: number) => void;
  maxInternalLevel?: number;
  maxLevel?: number;
  minInternalLevel?: number;
  minLevel?: number;
  pageSize: number;
  search: SongBrowserSearchParams;
  searchInput: string;
  setFilter: <K extends keyof SongBrowserSearchParams>(
    key: K,
    value: SongBrowserSearchParams[K],
  ) => void;
  setSearchInput: (value: string) => void;
  songs?: MaiDbSong[];
  totalCount?: number;
  useChartConstant: boolean;
};

const SongBrowserContext = createContext<SongBrowserContextValue | null>(null);

const DEFAULT_PAGE_SIZE = 30;

export function SongBrowser({
  children,
  filterOptions,
  initialSongs,
  onSearchChange,
  pageSize = DEFAULT_PAGE_SIZE,
  paginationMode = "infinite",
  resolveHydratedSongs,
  search,
}: {
  children: ReactNode;
  filterOptions?: SongBrowserFilterOptions;
  initialSongs?: MaiDbSong[];
  onSearchChange?: (updater: (prev: SongBrowserSearchParams) => SongBrowserSearchParams) => void;
  pageSize?: number;
  paginationMode?: SongBrowserPaginationMode;
  resolveHydratedSongs?: (songs: MaiDbSong[]) => MaiDbSong[];
  search?: SongBrowserSearchParams;
}) {
  const controlledSearch = search ?? {};
  const { songs: catalogSongs } = useSongCatalog();
  const [searchInput, setSearchInput] = useState(controlledSearch.q ?? "");
  const deferredSearch = useDeferredValue(searchInput);
  const [visibleCount, setVisibleCount] = useState(pageSize);

  useEffect(() => {
    setSearchInput(controlledSearch.q ?? "");
  }, [controlledSearch.q]);

  const baseSongs = useMemo(() => {
    if (catalogSongs) {
      return resolveHydratedSongs ? resolveHydratedSongs(catalogSongs) : catalogSongs;
    }

    return initialSongs;
  }, [catalogSongs, initialSongs, resolveHydratedSongs]);

  const searchQuery = deferredSearch.trim();

  useEffect(() => {
    if (!onSearchChange) return;
    if (searchQuery === (controlledSearch.q ?? "")) return;
    onSearchChange((prev) => ({ ...prev, q: searchQuery || undefined }));
  }, [controlledSearch.q, onSearchChange, searchQuery]);

  const setFilter = <K extends keyof SongBrowserSearchParams>(
    key: K,
    value: SongBrowserSearchParams[K],
  ) => {
    onSearchChange?.((prev) => ({ ...prev, [key]: value }));
  };

  const category = controlledSearch.category ?? "";
  const version = controlledSearch.version ?? "";
  const difficulty = controlledSearch.difficulty ?? "";
  const type = controlledSearch.type ?? "";
  const region = controlledSearch.region ?? "";
  const minBpm = controlledSearch.minBpm;
  const maxBpm = controlledSearch.maxBpm;
  const minLevel = controlledSearch.minLevel;
  const maxLevel = controlledSearch.maxLevel;
  const minInternalLevel = controlledSearch.minInternalLevel;
  const maxInternalLevel = controlledSearch.maxInternalLevel;
  const isNew = controlledSearch.isNew;

  const activeFilterCount = [
    category,
    version,
    difficulty,
    type,
    region,
    minBpm != null ? "y" : "",
    maxBpm != null ? "y" : "",
    minLevel != null ? "y" : "",
    maxLevel != null ? "y" : "",
    minInternalLevel != null ? "y" : "",
    maxInternalLevel != null ? "y" : "",
    isNew != null ? "y" : "",
  ].filter(Boolean).length;

  const filters: SongFilters = {
    ...(searchQuery ? { q: searchQuery } : {}),
    ...(category ? { category } : {}),
    ...(version ? { version } : {}),
    ...(difficulty ? { difficulty } : {}),
    ...(type ? { type } : {}),
    ...(region ? { region } : {}),
    ...(minBpm != null ? { minBpm } : {}),
    ...(maxBpm != null ? { maxBpm } : {}),
    ...(minLevel != null ? { minLevel } : {}),
    ...(maxLevel != null ? { maxLevel } : {}),
    ...(minInternalLevel != null ? { minInternalLevel } : {}),
    ...(maxInternalLevel != null ? { maxInternalLevel } : {}),
    ...(isNew != null ? { isNew } : {}),
  };

  const isFiltered = searchQuery.length > 0 || activeFilterCount > 0;

  const allSongs = useMemo(() => {
    if (!baseSongs) return undefined;
    return isFiltered ? filterSongs(baseSongs, filters) : baseSongs;
  }, [baseSongs, filters, isFiltered]);

  useEffect(() => {
    setVisibleCount(pageSize);
  }, [allSongs, pageSize, paginationMode]);

  const shouldShowAllSongs = paginationMode === "all" || isFiltered;

  const visibleSongs = shouldShowAllSongs || !allSongs ? allSongs : allSongs.slice(0, visibleCount);

  const canLoadMore =
    paginationMode === "infinite" &&
    !isFiltered &&
    allSongs != null &&
    visibleSongs != null &&
    visibleSongs.length < allSongs.length;

  const value: SongBrowserContextValue = {
    activeFilterCount,
    canLoadMore,
    filterOptions,
    isFiltered,
    isLoading: allSongs === undefined,
    loadMore: (pageCount = 1) =>
      startTransition(() => {
        setVisibleCount((count) => count + pageSize * Math.max(1, pageCount));
      }),
    maxInternalLevel,
    maxLevel,
    minInternalLevel,
    minLevel,
    pageSize,
    search: controlledSearch,
    searchInput,
    setFilter,
    setSearchInput,
    songs: visibleSongs,
    totalCount: allSongs?.length,
    useChartConstant: controlledSearch.useChartConstant ?? false,
  };

  return <SongBrowserContext value={value}>{children}</SongBrowserContext>;
}

export function useSongBrowser() {
  const context = useContext(SongBrowserContext);
  if (!context) {
    throw new Error("useSongBrowser must be used within <SongBrowser>");
  }

  return context;
}

import {
  createContext,
  startTransition,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { filterSongs, type MaiDbSong, type SongFilters } from "maidb-data";
import { useSongCatalog } from "../../lib/song-catalog";
import type { SongBrowserFilterOptions, SongBrowserSearchParams } from "./song-browser.types";

type SongBrowserPaginationMode = "infinite" | "all";

type LocalFilters = {
  category: string;
  version: string;
  difficulty: string;
  type: string;
  region: string;
  minBpm: number | undefined;
  maxBpm: number | undefined;
  minLevel: number | undefined;
  maxLevel: number | undefined;
  minInternalLevel: number | undefined;
  maxInternalLevel: number | undefined;
  isNew: boolean | undefined;
};

type SongBrowserContextValue = {
  activeFilterCount: number;
  canLoadMore: boolean;
  clearAllFilters: () => void;
  filterOptions?: SongBrowserFilterOptions;
  isFiltered: boolean;
  isLoading: boolean;
  isPending: boolean;
  localFilters: LocalFilters;
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
  setFilters: (updates: Partial<SongBrowserSearchParams>) => void;
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
  const [visibleCount, setVisibleCount] = useState(pageSize);

  // Immediate UI state for filters (for responsive inputs)
  const [localFilters, setLocalFilters] = useState({
    category: controlledSearch.category ?? "",
    version: controlledSearch.version ?? "",
    difficulty: controlledSearch.difficulty ?? "",
    type: controlledSearch.type ?? "",
    region: controlledSearch.region ?? "",
    minBpm: controlledSearch.minBpm,
    maxBpm: controlledSearch.maxBpm,
    minLevel: controlledSearch.minLevel,
    maxLevel: controlledSearch.maxLevel,
    minInternalLevel: controlledSearch.minInternalLevel,
    maxInternalLevel: controlledSearch.maxInternalLevel,
    isNew: controlledSearch.isNew,
  });

  // Sync local filters when URL changes (e.g., back button)
  useEffect(() => {
    setLocalFilters({
      category: controlledSearch.category ?? "",
      version: controlledSearch.version ?? "",
      difficulty: controlledSearch.difficulty ?? "",
      type: controlledSearch.type ?? "",
      region: controlledSearch.region ?? "",
      minBpm: controlledSearch.minBpm,
      maxBpm: controlledSearch.maxBpm,
      minLevel: controlledSearch.minLevel,
      maxLevel: controlledSearch.maxLevel,
      minInternalLevel: controlledSearch.minInternalLevel,
      maxInternalLevel: controlledSearch.maxInternalLevel,
      isNew: controlledSearch.isNew,
    });
  }, [
    controlledSearch.category,
    controlledSearch.version,
    controlledSearch.difficulty,
    controlledSearch.type,
    controlledSearch.region,
    controlledSearch.minBpm,
    controlledSearch.maxBpm,
    controlledSearch.minLevel,
    controlledSearch.maxLevel,
    controlledSearch.minInternalLevel,
    controlledSearch.maxInternalLevel,
    controlledSearch.isNew,
  ]);

  useEffect(() => {
    setSearchInput(controlledSearch.q ?? "");
  }, [controlledSearch.q]);

  const baseSongs = useMemo(() => {
    if (catalogSongs) {
      return resolveHydratedSongs ? resolveHydratedSongs(catalogSongs) : catalogSongs;
    }

    return initialSongs;
  }, [catalogSongs, initialSongs, resolveHydratedSongs]);

  const searchQuery = searchInput.trim();

  const filterDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const searchDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const flushFilterDebounce = useCallback(() => {
    if (filterDebounceRef.current) {
      clearTimeout(filterDebounceRef.current);
      filterDebounceRef.current = null;
    }
  }, []);

  const flushSearchDebounce = useCallback(() => {
    if (searchDebounceRef.current) {
      clearTimeout(searchDebounceRef.current);
      searchDebounceRef.current = null;
    }
  }, []);

  useEffect(() => {
    return () => {
      flushFilterDebounce();
      flushSearchDebounce();
    };
  }, [flushFilterDebounce, flushSearchDebounce]);

  // Debounced search URL update
  useEffect(() => {
    if (!onSearchChange) return;
    if (searchQuery === (controlledSearch.q ?? "")) return;

    flushSearchDebounce();
    searchDebounceRef.current = setTimeout(() => {
      startTransition(() => {
        onSearchChange((prev) => ({ ...prev, q: searchQuery || undefined }));
      });
    }, 150);

    return () => {
      flushSearchDebounce();
    };
  }, [controlledSearch.q, onSearchChange, searchQuery, flushSearchDebounce]);

  const setFilter = <K extends keyof SongBrowserSearchParams>(
    key: K,
    value: SongBrowserSearchParams[K],
  ) => {
    // Update local state immediately for responsive UI
    setLocalFilters((prev) => ({ ...prev, [key]: value }));

    // Debounce the URL/filter update
    flushFilterDebounce();
    filterDebounceRef.current = setTimeout(() => {
      startTransition(() => {
        onSearchChange?.((prev) => ({ ...prev, [key]: value }));
      });
    }, 50);
  };

  const setFilters = (updates: Partial<SongBrowserSearchParams>) => {
    setLocalFilters((prev) => ({
      ...prev,
      ...(updates.category !== undefined ? { category: updates.category ?? "" } : {}),
      ...(updates.version !== undefined ? { version: updates.version ?? "" } : {}),
      ...(updates.difficulty !== undefined ? { difficulty: updates.difficulty ?? "" } : {}),
      ...(updates.type !== undefined ? { type: updates.type ?? "" } : {}),
      ...(updates.region !== undefined ? { region: updates.region ?? "" } : {}),
      ...(updates.minBpm !== undefined || "minBpm" in updates ? { minBpm: updates.minBpm } : {}),
      ...(updates.maxBpm !== undefined || "maxBpm" in updates ? { maxBpm: updates.maxBpm } : {}),
      ...(updates.minLevel !== undefined || "minLevel" in updates
        ? { minLevel: updates.minLevel }
        : {}),
      ...(updates.maxLevel !== undefined || "maxLevel" in updates
        ? { maxLevel: updates.maxLevel }
        : {}),
      ...(updates.minInternalLevel !== undefined || "minInternalLevel" in updates
        ? { minInternalLevel: updates.minInternalLevel }
        : {}),
      ...(updates.maxInternalLevel !== undefined || "maxInternalLevel" in updates
        ? { maxInternalLevel: updates.maxInternalLevel }
        : {}),
      ...(updates.isNew !== undefined || "isNew" in updates ? { isNew: updates.isNew } : {}),
    }));

    flushFilterDebounce();
    filterDebounceRef.current = setTimeout(() => {
      startTransition(() => {
        onSearchChange?.((prev) => ({ ...prev, ...updates }));
      });
    }, 50);
  };

  const clearAllFilters = useCallback(() => {
    // Update all local state immediately for responsive UI
    setLocalFilters({
      category: "",
      version: "",
      difficulty: "",
      type: "",
      region: "",
      minBpm: undefined,
      maxBpm: undefined,
      minLevel: undefined,
      maxLevel: undefined,
      minInternalLevel: undefined,
      maxInternalLevel: undefined,
      isNew: undefined,
    });

    // Debounce a single URL update that clears all filters
    flushFilterDebounce();
    filterDebounceRef.current = setTimeout(() => {
      startTransition(() => {
        onSearchChange?.(() => ({
          q: controlledSearch.q,
        }));
      });
    }, 50);
  }, [controlledSearch.q, flushFilterDebounce, onSearchChange]);

  // Use localFilters for responsive UI - these update immediately
  const category = localFilters.category;
  const version = localFilters.version;
  const difficulty = localFilters.difficulty;
  const type = localFilters.type;
  const region = localFilters.region;
  const minBpm = localFilters.minBpm;
  const maxBpm = localFilters.maxBpm;
  const minLevel = localFilters.minLevel;
  const maxLevel = localFilters.maxLevel;
  const minInternalLevel = localFilters.minInternalLevel;
  const maxInternalLevel = localFilters.maxInternalLevel;
  const isNew = localFilters.isNew;

  const activeFilterCount = useMemo(
    () =>
      [
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
      ].filter(Boolean).length,
    [
      category,
      version,
      difficulty,
      type,
      region,
      minBpm,
      maxBpm,
      minLevel,
      maxLevel,
      minInternalLevel,
      maxInternalLevel,
      isNew,
    ],
  );

  const filters = useMemo<SongFilters>(
    () => ({
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
    }),
    [
      searchQuery,
      category,
      version,
      difficulty,
      type,
      region,
      minBpm,
      maxBpm,
      minLevel,
      maxLevel,
      minInternalLevel,
      maxInternalLevel,
      isNew,
    ],
  );

  const isFiltered = useMemo(
    () => searchQuery.length > 0 || activeFilterCount > 0,
    [searchQuery, activeFilterCount],
  );

  // Async filtering with debounce to keep UI responsive
  const [filteredSongs, setFilteredSongs] = useState<MaiDbSong[] | undefined>(baseSongs);
  const [isPending, setIsPending] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!baseSongs) {
      setFilteredSongs(undefined);
      return;
    }

    if (!isFiltered) {
      setFilteredSongs(baseSongs);
      setIsPending(false);
      return;
    }

    // Clear previous debounce
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    setIsPending(true);

    // Debounce the filtering to allow UI to update first
    debounceRef.current = setTimeout(() => {
      startTransition(() => {
        const result = filterSongs(baseSongs, filters);
        setFilteredSongs(result);
        setIsPending(false);
      });
    }, 50);

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [baseSongs, filters, isFiltered]);

  const allSongs = filteredSongs;

  useEffect(() => {
    setVisibleCount(pageSize);
  }, [allSongs, pageSize, paginationMode]);

  const shouldShowAllSongs = paginationMode === "all";

  const visibleSongs = shouldShowAllSongs || !allSongs ? allSongs : allSongs.slice(0, visibleCount);

  const canLoadMore =
    paginationMode === "infinite" &&
    allSongs != null &&
    visibleSongs != null &&
    visibleSongs.length < allSongs.length;

  const value: SongBrowserContextValue = {
    activeFilterCount,
    canLoadMore,
    clearAllFilters,
    filterOptions,
    isFiltered,
    isLoading: allSongs === undefined,
    isPending,
    localFilters,
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
    setFilters,
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

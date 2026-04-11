import type { MaiDbSong } from "maidb-data";
import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

type SongCatalogContextValue = {
  songs: MaiDbSong[] | null;
  isLoading: boolean;
};

const SongCatalogContext = createContext<SongCatalogContextValue>({
  songs: null,
  isLoading: false,
});

const DEFAULT_SONG_CATALOG_URL = "/songlist";

export function SongCatalogProvider({
  children,
  initialSongs = null,
  shouldHydrate = true,
  url = DEFAULT_SONG_CATALOG_URL,
}: {
  children: ReactNode;
  initialSongs?: MaiDbSong[] | null;
  shouldHydrate?: boolean;
  url?: string;
}) {
  const [songs, setSongs] = useState<MaiDbSong[] | null>(initialSongs);
  const [isLoading, setIsLoading] = useState(shouldHydrate && initialSongs == null);

  useEffect(() => {
    if (!shouldHydrate) {
      setSongs(initialSongs);
      setIsLoading(false);
      return;
    }

    let isMounted = true;

    setIsLoading(true);

    fetch(url)
      .then(async (res) => {
        if (!res.ok) {
          throw new Error(`Failed to load song catalog: ${res.status}`);
        }
        return (await res.json()) as MaiDbSong[];
      })
      .then((data) => {
        if (!isMounted) return;
        setSongs(data);
        setIsLoading(false);
      })
      .catch((err) => {
        if (!isMounted) return;
        console.error(`Failed to load ${url}:`, err);
        setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [initialSongs, shouldHydrate, url]);

  return <SongCatalogContext value={{ songs, isLoading }}>{children}</SongCatalogContext>;
}

export function useSongCatalog(): SongCatalogContextValue {
  return useContext(SongCatalogContext);
}

import type { MaiDbSong } from "maidb-data";
import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

type SongsContextValue = {
  songs: MaiDbSong[] | null;
  isLoading: boolean;
};

const SongsContext = createContext<SongsContextValue>({ songs: null, isLoading: true });

const SONGS_URL = "/songlist";

export function SongsProvider({ children }: { children: ReactNode }) {
  const [songs, setSongs] = useState<MaiDbSong[] | null>(null);

  useEffect(() => {
    fetch(SONGS_URL)
      .then(async (res) => {
        if (!res.ok) {
          throw new Error(`Failed to load songlist: ${res.status}`);
        }
        return (await res.json()) as MaiDbSong[];
      })
      .then((data) => setSongs(data))
      .catch((err) => console.error("Failed to load /songlist:", err));
  }, []);

  return <SongsContext value={{ songs, isLoading: songs === null }}>{children}</SongsContext>;
}

export function useSongs(): SongsContextValue {
  return useContext(SongsContext);
}

export function useSongBySlug(slug: string | undefined): MaiDbSong | null {
  const { songs } = useSongs();
  if (!slug || !songs) return null;
  return songs.find((s) => s.slug === slug) ?? null;
}

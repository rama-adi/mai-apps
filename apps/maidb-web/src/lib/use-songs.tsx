import type { MaiDbSong } from "maidb-data";
import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

type SongsContextValue = {
  songs: MaiDbSong[] | null;
  isLoading: boolean;
};

const SongsContext = createContext<SongsContextValue>({ songs: null, isLoading: true });

const SONGS_URL = import.meta.env.VITE_SONGS_JSON_URL as string | undefined;

export function SongsProvider({ children }: { children: ReactNode }) {
  const [songs, setSongs] = useState<MaiDbSong[] | null>(null);

  useEffect(() => {
    if (!SONGS_URL) return;

    fetch(SONGS_URL)
      .then((res) => res.json())
      .then((data: MaiDbSong[]) => setSongs(data))
      .catch((err) => console.error("Failed to load songs.json:", err));
  }, []);

  return (
    <SongsContext value={{ songs, isLoading: songs === null && !!SONGS_URL }}>
      {children}
    </SongsContext>
  );
}

export function useSongs(): SongsContextValue {
  return useContext(SongsContext);
}

export function useSongBySlug(slug: string | undefined): MaiDbSong | null {
  const { songs } = useSongs();
  if (!slug || !songs) return null;
  return songs.find((s) => s.slug === slug) ?? null;
}

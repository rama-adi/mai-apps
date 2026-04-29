import type { MaiDbSong, Metadata } from "maidb-data";
import { HomeBanner } from "./HomeBanner";
import { HomeCategories } from "./HomeCategories";
import { HomeHero } from "./HomeHero";
import { HomeNewest } from "./HomeNewest";
import { HomeVersions } from "./HomeVersions";

interface HomeContentProps {
  latestSongs: MaiDbSong[];
  metadata: Metadata;
  onSongSelect: (song: MaiDbSong) => void;
}

export function HomeContent({ latestSongs, metadata, onSongSelect }: HomeContentProps) {
  const featuredSongs = latestSongs.slice(0, 12);

  return (
    <>
      <HomeHero />

      <div className="mx-auto max-w-5xl px-4 pb-20" data-song-browser-surface="">
        <HomeNewest songs={featuredSongs} onSongSelect={onSongSelect} />
        <HomeCategories categories={metadata.categories} />
        <HomeVersions versions={metadata.versions} />
        <HomeBanner />
      </div>
    </>
  );
}

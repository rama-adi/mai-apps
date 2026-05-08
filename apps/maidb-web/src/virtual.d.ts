declare module "virtual:songs-seo" {
  import type { SongSeoData } from "maidb-data";
  const data: SongSeoData;
  export default data;
}

declare module "virtual:songs-seo-slugs" {
  const slugs: string[];
  export default slugs;
}

import { join } from "path";

export const PKG_ROOT = join(import.meta.dirname, "../..");
export const SCRATCH_DIR = join(PKG_ROOT, "scratch");
export const ASSETS_DIR = join(PKG_ROOT, "assets");
export const DATA_DIR = join(PKG_ROOT, "data/songs");
export const SONGS_JSON_PATH = join(DATA_DIR, "songs.json");
export const METADATA_JSON_PATH = join(DATA_DIR, "metadata.json");
export const LATEST_JSON_PATH = join(DATA_DIR, "latest-only.json");
export const FILTERS_JSON_PATH = join(DATA_DIR, "filters.json");
export const RECEIPTS_PATH = join(SCRATCH_DIR, "image-assets-receipts.json");
export const THUMB_DIR = join(SCRATCH_DIR, "thumb");
export const OG_DIR = join(SCRATCH_DIR, "og-v1");

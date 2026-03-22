import { join } from "path";

export const PKG_ROOT = join(import.meta.dirname, "../..");
export const SCRATCH_DIR = join(PKG_ROOT, "scratch");
export const ASSETS_DIR = join(PKG_ROOT, "assets");
export const SONGS_JSON_PATH = join(PKG_ROOT, "songs.json");
export const RECEIPTS_PATH = join(SCRATCH_DIR, "image-assets-receipts.json");
export const THUMB_DIR = join(SCRATCH_DIR, "thumb");
export const OG_DIR = join(SCRATCH_DIR, "og-v1");

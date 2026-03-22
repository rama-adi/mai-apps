import { join } from "path";

export const SCRATCH_DIR = join(import.meta.dirname, "../../scratch");
export const ASSETS_DIR = join(import.meta.dirname, "../../assets");

export const SONGS_PATH = join(SCRATCH_DIR, "songs.jsonl");
export const METADATA_PATH = join(SCRATCH_DIR, "metadata.json");
export const RECEIPTS_PATH = join(SCRATCH_DIR, "image-assets-receipts.json");
export const BACKFILL_INPUT_PATH = join(SCRATCH_DIR, "backfill-receipts.json");
export const BACKFILL_RECEIPTS_PATH = join(SCRATCH_DIR, "backfill-image-assets-receipts.json");
export const THUMB_DIR = join(SCRATCH_DIR, "thumb");
export const OG_DIR = join(SCRATCH_DIR, "og-v1");

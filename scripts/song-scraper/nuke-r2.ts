import { ListObjectsV2Command, DeleteObjectsCommand } from "@aws-sdk/client-s3";
import { readFileSync, writeFileSync, existsSync, rmSync } from "fs";
import { createS3Client } from "./shared/s3.js";
import { RECEIPTS_PATH, THUMB_DIR, OG_DIR, SONGS_JSON_PATH } from "./shared/paths.js";
import type { MaiDbSong, Receipt } from "maidb-data";

const { s3, bucket } = createS3Client();

async function deletePrefix(prefix: string) {
  let continuationToken: string | undefined;
  let totalDeleted = 0;

  do {
    const list = await s3.send(
      new ListObjectsV2Command({
        Bucket: bucket,
        Prefix: prefix,
        ContinuationToken: continuationToken,
      }),
    );

    const keys = (list.Contents ?? []).map((o) => ({ Key: o.Key! }));
    if (keys.length > 0) {
      await s3.send(
        new DeleteObjectsCommand({
          Bucket: bucket,
          Delete: { Objects: keys },
        }),
      );
      totalDeleted += keys.length;
    }

    continuationToken = list.IsTruncated ? list.NextContinuationToken : undefined;
  } while (continuationToken);

  return totalDeleted;
}

async function main() {
  console.log("Nuking R2 thumb/ and og-v1/ prefixes...");

  const [thumbCount, ogCount] = await Promise.all([deletePrefix("thumb/"), deletePrefix("og-v1/")]);

  console.log(`Deleted ${thumbCount} thumbnails, ${ogCount} OG images from R2.`);

  // Clear local scratch dirs
  for (const dir of [THUMB_DIR, OG_DIR]) {
    if (existsSync(dir)) {
      rmSync(dir, { recursive: true });
      console.log(`Removed local ${dir}`);
    }
  }

  // Clear receipts
  if (existsSync(RECEIPTS_PATH)) {
    rmSync(RECEIPTS_PATH);
    console.log("Removed receipts file.");
  }

  // Clear internalImageId from songs.json
  if (existsSync(SONGS_JSON_PATH)) {
    const songs: MaiDbSong[] = JSON.parse(readFileSync(SONGS_JSON_PATH, "utf-8"));
    let cleared = 0;
    for (const song of songs) {
      if (song.internalImageId) {
        song.internalImageId = null as unknown as string;
        cleared++;
      }
    }
    if (cleared > 0) {
      writeFileSync(SONGS_JSON_PATH, JSON.stringify(songs, null, 2) + "\n");
      console.log(`Cleared internalImageId from ${cleared} songs.`);
    }
  }

  console.log("Done. Run create-image-assets + upload-to-s3 to regenerate.");
}

main().catch(console.error);

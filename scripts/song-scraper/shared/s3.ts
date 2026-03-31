import { S3Client } from "@aws-sdk/client-s3";
import "dotenv/config";

export function createS3Client(): { s3: S3Client; bucket: string } {
  const accessKeyId = process.env.S3_ACCESS_KEY_ID;
  const secretAccessKey = process.env.S3_SECRET_ACCESS_KEY;
  const bucket = process.env.S3_BUCKET;
  const endpoint = process.env.S3_ENDPOINT;
  const region = process.env.S3_REGION ?? "auto";

  if (!accessKeyId || !secretAccessKey || !bucket || !endpoint) {
    throw new Error(
      "Missing S3 env vars. Set: S3_ACCESS_KEY_ID, S3_SECRET_ACCESS_KEY, S3_BUCKET, S3_ENDPOINT",
    );
  }

  const s3 = new S3Client({
    credentials: { accessKeyId, secretAccessKey },
    endpoint,
    region,
    forcePathStyle: true,
  });

  return { s3, bucket };
}

import { ConvexHttpClient } from "convex/browser";
import "dotenv/config";

export function createConvexClient(): { client: ConvexHttpClient; seedSecret: string } {
  const convexUrl = process.env.CONVEX_URL;
  const seedSecret = process.env.SEED_SECRET;
  if (!convexUrl || !seedSecret) {
    console.error("Set CONVEX_URL and SEED_SECRET environment variables");
    process.exit(1);
  }

  return { client: new ConvexHttpClient(convexUrl), seedSecret };
}

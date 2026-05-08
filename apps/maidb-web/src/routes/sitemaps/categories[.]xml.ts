import { createFileRoute } from "@tanstack/react-router";
import { getMetadata } from "../../lib/song-data.server";
import { SITE_URL } from "../../lib/site";
import { buildUrlset, xmlResponse } from "../../lib/sitemap";

const GET = async () => {
  const metadata = await getMetadata();
  const locs = metadata.categories.map((c) => `${SITE_URL}/category/${c.slug}`);
  return xmlResponse(buildUrlset(locs));
};

export const Route = createFileRoute("/sitemaps/categories.xml")({
  server: {
    handlers: {
      GET,
      HEAD: GET,
    },
  },
});

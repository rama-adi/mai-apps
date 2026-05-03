import { createFileRoute } from "@tanstack/react-router";
import { getMetadata } from "../../lib/song-data.server";
import { SITE_URL } from "../../lib/site";
import { buildUrlset, xmlResponse } from "../../lib/sitemap";

const GET = async () => {
  const metadata = await getMetadata();
  const locs = metadata.versions.map((v) => `${SITE_URL}/version/${v.slug}`);
  return xmlResponse(buildUrlset(locs));
};

export const Route = createFileRoute("/sitemaps/versions.xml")({
  server: {
    handlers: {
      GET,
      HEAD: GET,
    },
  },
});

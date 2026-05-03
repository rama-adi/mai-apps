import { createFileRoute } from "@tanstack/react-router";
import { SITE_URL } from "../../lib/site";
import { buildUrlset, xmlResponse } from "../../lib/sitemap";

const GET = async () => {
  return xmlResponse(buildUrlset([`${SITE_URL}/`, `${SITE_URL}/songs`, `${SITE_URL}/about`]));
};

export const Route = createFileRoute("/sitemaps/meta.xml")({
  server: {
    handlers: {
      GET,
      HEAD: GET,
    },
  },
});

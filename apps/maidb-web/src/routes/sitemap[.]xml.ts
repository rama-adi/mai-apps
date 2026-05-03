import { createFileRoute } from "@tanstack/react-router";
import { SITE_URL } from "../lib/site";
import { buildSitemapIndex, xmlResponse } from "../lib/sitemap";

const GET = async () => {
  return xmlResponse(
    buildSitemapIndex([
      { loc: `${SITE_URL}/sitemaps/meta.xml` },
      { loc: `${SITE_URL}/sitemaps/songs.xml` },
      { loc: `${SITE_URL}/sitemaps/versions.xml` },
      { loc: `${SITE_URL}/sitemaps/categories.xml` },
    ]),
  );
};

export const Route = createFileRoute("/sitemap.xml")({
  server: {
    handlers: {
      GET,
      HEAD: GET,
    },
  },
});

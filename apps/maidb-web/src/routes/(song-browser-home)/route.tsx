import { createFileRoute, Outlet } from "@tanstack/react-router";
import { OG_IMAGE_LOCAL_BASE, SITE_LOCALE, SITE_NAME, SITE_URL } from "../../lib/site";

const TITLE = "MaiDB - The Complete maimai Song Database";
const DESCRIPTION =
  "Explore every maimai song and chart. Browse difficulty levels, BPM, version history, and more — all in one place.";
const OG_TITLE = "MaiDB - maimai Song Database";
const OG_DESCRIPTION =
  "Browse the complete maimai song catalog with charts, difficulties, BPM, and version history.";
const OG_IMAGE = `${OG_IMAGE_LOCAL_BASE}/meta-home.jpg`;

export const Route = createFileRoute("/(song-browser-home)")({
  head: () => ({
    meta: [
      { title: TITLE },
      { name: "description", content: DESCRIPTION },

      { property: "og:type", content: "website" },
      { property: "og:title", content: OG_TITLE },
      { property: "og:description", content: OG_DESCRIPTION },
      { property: "og:url", content: SITE_URL },
      { property: "og:site_name", content: SITE_NAME },
      { property: "og:locale", content: SITE_LOCALE },
      { property: "og:image", content: OG_IMAGE },
      { property: "og:image:alt", content: "MaiDB — maimai Song Database" },

      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: OG_TITLE },
      { name: "twitter:description", content: OG_DESCRIPTION },
      { name: "twitter:image", content: OG_IMAGE },
    ],
    links: [{ rel: "canonical", href: SITE_URL }],
  }),
  component: Outlet,
});

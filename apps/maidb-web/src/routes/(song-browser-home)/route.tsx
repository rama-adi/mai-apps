import { createFileRoute, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/(song-browser-home)")({
  head: () => ({
    meta: [
      { title: "MaiDB - The Complete maimai Song Database" },
      {
        name: "description",
        content:
          "Explore every maimai song and chart. Browse difficulty levels, BPM, version history, and more — all in one place.",
      },
      { property: "og:title", content: "MaiDB - maimai Song Database" },
      {
        property: "og:description",
        content:
          "Browse the complete maimai song catalog with charts, difficulties, BPM, and version history.",
      },
    ],
  }),
  component: Outlet,
});

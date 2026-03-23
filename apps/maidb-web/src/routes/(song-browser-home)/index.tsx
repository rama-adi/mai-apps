import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/(song-browser-home)/")({
  component: HomeIndexRoute,
});

function HomeIndexRoute() {
  return null;
}

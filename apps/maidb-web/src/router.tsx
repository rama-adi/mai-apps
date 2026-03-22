import { createRouteMask, createRouter as createTanStackRouter } from "@tanstack/react-router";
import { routeTree } from "./routeTree.gen";

export function getRouter() {
  const songModalMask = createRouteMask({
    routeTree,
    from: "/song-modal/$slug",
    to: "/songs/$slug",
    params: true,
    unmaskOnReload: true,
  });

  const router = createTanStackRouter({
    routeTree,
    routeMasks: [songModalMask],
    scrollRestoration: true,
    defaultPreload: "intent",
    defaultPreloadStaleTime: 0,
  });

  return router;
}

declare module "@tanstack/react-router" {
  interface Register {
    router: ReturnType<typeof getRouter>;
  }
}

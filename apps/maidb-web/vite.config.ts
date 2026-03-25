import { defineConfig } from "vite";
import { cloudflare } from "@cloudflare/vite-plugin";
import { devtools } from "@tanstack/devtools-vite";

import { tanstackStart } from "@tanstack/react-start/plugin/vite";

import viteReact from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

const config = defineConfig({
  plugins: [
    cloudflare({ viteEnvironment: { name: "ssr" } }),
    devtools(),
    tailwindcss(),
    tanstackStart({
      prerender: {
        enabled: true,
      },
      router: {
        enableRouteTreeFormatting: false,
        quoteStyle: "single",
        semicolons: false,
        routeFileIgnorePrefix: "-",
      },
    }),
    viteReact(),
  ],
  resolve: {
    tsconfigPaths: true,
  },
});

export default config;

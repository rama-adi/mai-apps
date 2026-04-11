import { defineConfig } from "vite";
import { cloudflare } from "@cloudflare/vite-plugin";
import { devtools } from "@tanstack/devtools-vite";
import { fileURLToPath, URL } from "node:url";

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
    alias: [
      {
        find: /^maidb-data$/,
        replacement: fileURLToPath(
          new URL("../../packages/maidb-data/src/index.ts", import.meta.url),
        ),
      },
    ],
    tsconfigPaths: true,
  },
});

export default config;

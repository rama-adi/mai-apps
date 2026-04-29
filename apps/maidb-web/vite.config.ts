import { defineConfig, type Plugin } from "vite";
import { cloudflare } from "@cloudflare/vite-plugin";
import { devtools } from "@tanstack/devtools-vite";
import { existsSync, readFileSync } from "node:fs";
import { fileURLToPath, URL } from "node:url";

import { tanstackStart } from "@tanstack/react-start/plugin/vite";

import viteReact from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

const SEO_VIRTUAL_ID = "virtual:songs-seo";
const SEO_RESOLVED_ID = "\0" + SEO_VIRTUAL_ID;
const SEO_FILE = fileURLToPath(new URL("./songs-seo.json", import.meta.url));

function songsSeoPlugin(): Plugin {
  let isBuild = false;
  return {
    name: "songs-seo-virtual",
    configResolved(config) {
      isBuild = config.command === "build";
    },
    resolveId(id) {
      if (id === SEO_VIRTUAL_ID) return SEO_RESOLVED_ID;
      return null;
    },
    load(id) {
      if (id !== SEO_RESOLVED_ID) return null;
      const include = !isBuild || process.env.INCLUDE_SEO === "true";
      this.addWatchFile(SEO_FILE);
      if (!include || !existsSync(SEO_FILE)) {
        return "export default [];";
      }
      const raw = readFileSync(SEO_FILE, "utf8");
      return `export default ${raw};`;
    },
    handleHotUpdate({ file, server }) {
      if (file !== SEO_FILE) return;
      const mod = server.moduleGraph.getModuleById(SEO_RESOLVED_ID);
      if (mod) {
        server.moduleGraph.invalidateModule(mod);
        return [mod];
      }
    },
  };
}

const config = defineConfig({
  plugins: [
    songsSeoPlugin(),
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

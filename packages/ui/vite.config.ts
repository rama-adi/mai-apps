import { defineConfig } from "vite-plus";

export default defineConfig({
  pack: {
    entry: {
      "lib/utils": "src/lib/utils.ts",
    },
    dts: {
      tsgo: true,
    },
    exports: true,
  },
  lint: {
    options: {
      typeAware: true,
      typeCheck: true,
    },
  },
  fmt: {},
});

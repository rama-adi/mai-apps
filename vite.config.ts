import { defineConfig } from "vite-plus";

export default defineConfig({
  staged: {
    "!**/routeTree.gen.ts": "vp check --fix",
  },
  lint: { options: { typeAware: true, typeCheck: true } },
});

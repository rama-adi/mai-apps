import { defineConfig } from "vite-plus";

export default defineConfig({
  staged: {
    "!packages/backend/convex/_generated/**": "vp check --fix",
  },
  lint: { options: { typeAware: true, typeCheck: true } },
});

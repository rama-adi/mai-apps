import { defineConfig } from "vite-plus";

export default defineConfig({
  pack: {
    entry: {
      "lib/utils": "src/lib/utils.ts",
      "components/ui/button": "src/components/ui/button.tsx",
      "components/ui/card": "src/components/ui/card.tsx",
      "components/ui/badge": "src/components/ui/badge.tsx",
      "components/ui/skeleton": "src/components/ui/skeleton.tsx",
      "components/ui/separator": "src/components/ui/separator.tsx",
      "components/ui/input": "src/components/ui/input.tsx",
      "components/ui/select": "src/components/ui/select.tsx",
      "components/ui/collapsible": "src/components/ui/collapsible.tsx",
      "components/ui/dialog": "src/components/ui/dialog.tsx",
      "components/ui/tabs": "src/components/ui/tabs.tsx",
      "components/ui/switch": "src/components/ui/switch.tsx",
      "components/ui/toggle": "src/components/ui/toggle.tsx",
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

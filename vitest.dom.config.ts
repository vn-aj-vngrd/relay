import path from "node:path";

import { defineProject } from "vitest/config";

export default defineProject({
  resolve: { alias: { "@": path.resolve(import.meta.dirname, "src") } },
  test: {
    environment: "jsdom",
    include: [
      "src/**/*.test.tsx",
      "src/features/venues/court-map.test.ts",
      "src/features/venues/map-fullscreen-control.test.ts",
    ],
    name: "dom",
    setupFiles: ["./vitest.setup.ts"],
  },
});

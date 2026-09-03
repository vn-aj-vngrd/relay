import path from "node:path";

import { defineProject } from "vitest/config";

export default defineProject({
  resolve: { alias: { "@": path.resolve(import.meta.dirname, "src") } },
  test: {
    environment: "node",
    exclude: [
      "src/features/venues/court-map.test.ts",
      "src/features/venues/map-fullscreen-control.test.ts",
    ],
    include: ["src/**/*.test.ts"],
    name: "node",
  },
});

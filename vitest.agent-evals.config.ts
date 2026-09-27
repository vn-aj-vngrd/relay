import path from "node:path";

import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: { alias: { "@": path.resolve(import.meta.dirname, "src") } },
  test: {
    environment: "node",
    include: ["evals/**/*.eval.ts"],
    maxWorkers: 1,
    testTimeout: 60_000,
  },
});

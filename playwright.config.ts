import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  timeout: 60_000,
  fullyParallel: !process.env.E2E_BASE_URL,
  workers: process.env.E2E_BASE_URL ? 1 : undefined,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 2 : 0,
  reporter: [["list"], ["html", { open: "never" }]],
  use: {
    baseURL: process.env.E2E_BASE_URL ?? "http://localhost:3002",
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    actionTimeout: 15_000,
    navigationTimeout: 30_000,
  },
  projects: process.env.E2E_BASE_URL
    ? [
        {
          name: "mobile-chromium",
          grepInvert: /authenticated host and guest/,
          use: { ...devices["iPhone 13"], browserName: "chromium" },
        },
        {
          name: "desktop-authenticated",
          grep: /authenticated host and guest/,
          use: { ...devices["Desktop Chrome"] },
        },
      ]
    : [
        {
          name: "mobile-chromium",
          use: { ...devices["iPhone 13"], browserName: "chromium" },
        },
        { name: "desktop-chromium", use: { ...devices["Desktop Chrome"] } },
      ],
  webServer: process.env.E2E_BASE_URL
    ? undefined
    : {
        command: "corepack pnpm dev",
        url: "http://localhost:3002/login",
        reuseExistingServer: !process.env.CI,
        timeout: 120_000,
      },
});

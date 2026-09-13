import { defineConfig, devices } from "@playwright/test";
import base from "./playwright.config";

const profile = process.env.RELIABILITY_PROFILE ?? "essential";
if (!["essential", "full"].includes(profile)) {
  throw new Error("RELIABILITY_PROFILE must be essential or full.");
}
if (process.env.E2E_BASE_URL) {
  throw new Error(
    "Reliability uses a loopback app and a dedicated test backend."
  );
}
for (const key of [
  "E2E_AUTH_USER_ID",
  "E2E_AUTH_EMAIL",
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY",
  "SUPABASE_SECRET_KEY",
  "DATABASE_URL",
]) {
  if (!process.env[key]?.trim()) {
    throw new Error(`Required reliability configuration is missing: ${key}`);
  }
}
if (process.env.E2E_SESSION_FIXTURE !== "true") {
  throw new Error("Reliability requires the trusted test-session opt-in.");
}
if (process.env.E2E_REUSE_SESSION_ID || process.env.E2E_RETAIN_SESSION) {
  throw new Error(
    "Reliability requires a fresh lifecycle with normal cleanup."
  );
}

export default defineConfig(base, {
  fullyParallel: false,
  workers: 1,
  retries: 0,
  reporter: [["list"], ["./e2e/helpers/reliability-reporter.ts"]],
  use: {
    baseURL: "http://localhost:3002",
    // Authenticated traces contain cookies; this repository is public.
    trace: "off",
    screenshot: "off",
    video: "off",
  },
  projects: [
    {
      name: "mobile-chromium",
      testIgnore: "**/game-branches.spec.ts",
      ...(profile === "essential"
        ? {
            testMatch: "**/smoke.spec.ts",
            grep: /the landing page introduces Relay|public Quick Play prepares players|login and account creation have distinct entry routes/,
          }
        : { grepInvert: /authenticated host and guest/ }),
      use: { ...devices["iPhone 13"], browserName: "chromium" },
    },
    {
      name: "desktop-chromium",
      testMatch: "**/smoke.spec.ts",
      grep: /authenticated host and guest/,
      use: { ...devices["Desktop Chrome"] },
    },
  ],
  webServer: {
    command: "corepack pnpm start",
    url: "http://localhost:3002/login",
    reuseExistingServer: false,
    timeout: 120_000,
  },
});

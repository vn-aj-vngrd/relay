import type { FullResult, Suite } from "@playwright/test/reporter";
import { afterEach, describe, expect, it, vi } from "vitest";
import ReliabilityReporter from "../../e2e/helpers/reliability-reporter";

async function report(statuses: string[], status = "passed") {
  const reporter = new ReliabilityReporter();
  reporter.onBegin({}, {
    allTests: () =>
      statuses.map((testStatus) => ({
        expectedStatus: "passed",
        results: [{ status: testStatus }],
      })),
  } as unknown as Suite);
  return (await reporter.onEnd({ status } as FullResult)).status;
}

describe("reliability completion", () => {
  it("passes only completed selected journeys", () =>
    expect(report(["passed", "passed"])).resolves.toBe("passed"));
  it.each(["skipped", "failed", "timedOut", "interrupted"])(
    "rejects a %s journey",
    (status) => expect(report(["passed", status])).resolves.toBe("failed")
  );
  it("rejects an empty run and preserves infrastructure failure", async () => {
    await expect(report([])).resolves.toBe("failed");
    await expect(report(["passed"], "failed")).resolves.toBe("failed");
  });
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.resetModules();
});

describe("reliability configuration", () => {
  it("fails instead of silently skipping when the account is missing", async () => {
    vi.stubEnv("E2E_BASE_URL", "");
    vi.stubEnv("E2E_AUTH_USER_ID", "");
    await expect(import("../../playwright.reliability.config")).rejects.toThrow(
      "E2E_AUTH_USER_ID"
    );
  });
  it("rejects a hosted app URL", async () => {
    vi.stubEnv("E2E_BASE_URL", "https://example.com");
    await expect(import("../../playwright.reliability.config")).rejects.toThrow(
      "loopback"
    );
  });
});

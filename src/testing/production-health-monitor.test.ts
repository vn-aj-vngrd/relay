import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const workflow = readFileSync(".github/workflows/health-monitor.yml", "utf8");
const checks = [...workflow.matchAll(/ {8}run: \|\n((?: {10}.*\n?)+)/g)].map(
  (match) => match[1].replace(/^ {10}/gm, "")
);

// Execute the actual monitoring commands with a fake HTTP transport. This catches
// successful curl exits for redirects/empty bodies without making network calls.
function run(index: number, body: string, exitCode = 0) {
  return spawnSync(
    "bash",
    [
      "-c",
      `curl() { printf '%s' "$PROBE_BODY"; return "$PROBE_EXIT"; }\n${checks[index]}`,
    ],
    {
      env: {
        ...process.env,
        PROBE_BODY: body,
        PROBE_EXIT: String(exitCode),
        HEALTHCHECK_SECRET: "test-only-secret",
      },
      encoding: "utf8",
    }
  ).status;
}

describe("production health monitor", () => {
  it("defines public and database probes", () => {
    expect(checks).toHaveLength(2);
  });
  it.each([0, 1])(
    "probe %s rejects redirect/empty responses even when curl exits successfully",
    (index) => {
      expect(run(index, "")).not.toBe(0);
      expect(run(index, "Redirecting…")).not.toBe(0);
    }
  );
  it.each([0, 1])(
    "probe %s rejects HTTP failure and degraded responses",
    (index) => {
      expect(run(index, '{"status":"ok","database":"reachable"}', 22)).not.toBe(
        0
      );
      expect(
        run(index, '{"status":"degraded","database":"unreachable"}')
      ).not.toBe(0);
    }
  );
  it("requires the expected readiness facts", () => {
    expect(run(0, '{"status":"ok","release":"release-sha"}')).toBe(0);
    expect(run(1, '{"status":"ok"}')).not.toBe(0);
    expect(run(1, '{"status":"ok","database":"reachable"}')).toBe(0);
  });
});

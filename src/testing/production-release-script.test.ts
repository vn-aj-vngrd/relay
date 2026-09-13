import { spawnSync } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { expect, it } from "vitest";

it("does not declare a complete release after public-only verification", () => {
  const directory = mkdtempSync(join(tmpdir(), "relay-release-gate-"));
  const calls = join(directory, "calls");
  try {
    for (const [name, body] of Object.entries({
      pnpm: 'printf "%s\\n" "$*" >> "$PROBE_CALLS"',
      sleep: "exit 0",
      curl: `case "$*" in
        *--write-out*) printf '200\\n' ;;
        *--head*) printf "content-security-policy: script-src 'strict-dynamic'\\n" ;;
        *) printf '{"status":"ok","database":"reachable"}' ;;
      esac`,
    })) {
      writeFileSync(join(directory, name), `#!/usr/bin/env bash\n${body}\n`, {
        mode: 0o700,
      });
    }
    const result = spawnSync("bash", ["scripts/verify-production-release.sh"], {
      env: {
        ...process.env,
        PATH: `${directory}:${process.env.PATH}`,
        PROBE_CALLS: calls,
        HEALTHCHECK_SECRET: "test-only-secret",
      },
      encoding: "utf8",
      timeout: 5000,
    });
    expect(result.status).toBe(2);
    expect(result.stderr).toContain("RELEASE INCOMPLETE");
    expect(result.stdout).toContain("PASS private database readiness");
    const invoked = readFileSync(calls, "utf8");
    expect(invoked).toContain("--project mobile-chromium");
    expect(invoked).not.toContain("desktop-authenticated");
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
});

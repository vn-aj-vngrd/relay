import { execFileSync, spawnSync } from "node:child_process";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { describe, expect, it } from "vitest";

const validator = resolve("scripts/validate-commit-message.mjs");

function validate(subject: string, branch?: string) {
  const directory = mkdtempSync(join(tmpdir(), "relay-commit-test-"));
  try {
    if (branch) {
      execFileSync("git", ["init", "--quiet", directory]);
      execFileSync("git", ["symbolic-ref", "HEAD", `refs/heads/${branch}`], {
        cwd: directory,
      });
    }
    const message = join(directory, "COMMIT_EDITMSG");
    writeFileSync(message, subject);
    return spawnSync(process.execPath, [validator, message], {
      cwd: directory,
      encoding: "utf8",
    });
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
}

describe("commit message hook", () => {
  it.each([
    ["fix(games): Align tabs", "van/game-tab-spacing", 0],
    ["feat!: Change game contract", "van/game-contract", 0],
    ["RELAY-123: Align tabs", "van/RELAY-123/game-tab-spacing", 0],
    ["RELAY-124: Align tabs", "van/RELAY-123/game-tab-spacing", 1],
    ["RELAY-123: Align tabs", "van/game-tab-spacing", 1],
    ["RELAY-123: ", "van/RELAY-123/game-tab-spacing", 1],
    ["Update code", "van/game-tab-spacing", 1],
    ["Merge remote-tracking branch 'origin/master'", "van/game-tab-spacing", 0],
    ['Revert "fix(games): Align tabs"', "van/game-tab-spacing", 0],
  ])("validates %s on %s", (subject, branch, expected) => {
    const result = validate(subject, branch);
    expect(result.status, result.stderr).toBe(expected);
  });

  it("accepts conventional syntax when a Git branch is unavailable", () => {
    const result = validate("docs: Describe contribution standards");
    expect(result.status, result.stderr).toBe(0);
  });
});

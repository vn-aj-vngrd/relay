import { spawnSync } from "node:child_process";
import { describe, expect, it } from "vitest";

describe("release commit convention", () => {
  it.each([
    ["fix: Correct payment proof", "patch"],
    ["feat: Add game reminders", "minor"],
    ["feat!: Change game contract", "major"],
    ["fix: Change contract\n\nBREAKING CHANGE: Remove legacy API", "major"],
    ["docs: Explain invitations", "patch"],
    ["ci: Improve release automation", "patch"],
  ])("versions %s as %s", (message, expected) => {
    // Exercise the installed standard analyzer and actual project config.
    const code = `
      import { createRequire } from 'node:module';
      import { readFileSync } from 'node:fs';
      import { pathToFileURL } from 'node:url';
      const require = createRequire(import.meta.resolve('semantic-release'));
      const { analyzeCommits } = await import(pathToFileURL(require.resolve('@semantic-release/commit-analyzer')).href);
      const config = JSON.parse(readFileSync('.releaserc.json', 'utf8'));
      const result = await analyzeCommits(config.plugins[0][1], {
        cwd: process.cwd(), logger: { log() {} },
        commits: [{ message: process.env.RELEASE_TEST_MESSAGE, hash: 'a'.repeat(40) }]
      });
      process.stdout.write(JSON.stringify(result));
    `;
    const result = spawnSync(
      process.execPath,
      ["--input-type=module", "-e", code],
      {
        env: { ...process.env, RELEASE_TEST_MESSAGE: message },
        encoding: "utf8",
      }
    );
    expect(result.status, result.stderr).toBe(0);
    expect(JSON.parse(result.stdout)).toBe(expected);
  });
});

it("renders nonempty categorized release notes with the installed tooling", () => {
  const code = `
    import { createRequire } from 'node:module';
    import { readFileSync } from 'node:fs';
    import { pathToFileURL } from 'node:url';
    const require = createRequire(import.meta.resolve('semantic-release'));
    const { generateNotes } = await import(pathToFileURL(require.resolve('@semantic-release/release-notes-generator')).href);
    const config = JSON.parse(readFileSync('.releaserc.json', 'utf8'));
    const notes = await generateNotes(config.plugins[1][1], {
      cwd: process.cwd(), logger: { log() {} },
      options: { repositoryUrl: 'https://github.com/vn-aj-vngrd/relay' },
      lastRelease: {}, nextRelease: { version: '1.0.0', gitTag: 'v1.0.0' },
      commits: [
        { message: 'feat: Add invitations', hash: 'a'.repeat(40) },
        { message: 'fix: Correct payment proof', hash: 'b'.repeat(40) },
        { message: 'ci: Automate releases', hash: 'c'.repeat(40) }
      ]
    });
    process.stdout.write(notes);
  `;
  const result = spawnSync(
    process.execPath,
    ["--input-type=module", "-e", code],
    {
      encoding: "utf8",
    }
  );
  expect(result.status, result.stderr).toBe(0);
  for (const text of [
    "1.0.0",
    "Features",
    "Add invitations",
    "Fixes",
    "Correct payment proof",
    "Automation",
    "Automate releases",
  ]) {
    expect(result.stdout).toContain(text);
  }
});

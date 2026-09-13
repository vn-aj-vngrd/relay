#!/usr/bin/env node

import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";

const messagePath = process.argv[2];
if (!messagePath) {
  throw new Error("Expected the commit message file path.");
}

const subject = readFileSync(messagePath, "utf8").split("\n", 1)[0].trim();
const conventional =
  /^(build|chore|ci|docs|feat|fix|perf|refactor|revert|style|test)(\([a-z0-9][a-z0-9._/-]*\))?!?: .+$/u;
const generated = /^(Merge |Revert ")/u;

let ticket;
try {
  const branch = execFileSync("git", ["branch", "--show-current"], {
    encoding: "utf8",
    stdio: ["ignore", "pipe", "ignore"],
  }).trim();
  ticket = /^[^/]+\/([A-Z][A-Z0-9]*-\d+)\/[^/]+$/u.exec(branch)?.[1];
} catch {
  // Detached/non-repository validation still accepts Conventional Commits.
}
const ticketSubject = ticket
  ? subject.startsWith(`${ticket}: `) &&
    subject.slice(ticket.length + 2).trim().length > 0
  : false;

if (!(conventional.test(subject) || generated.test(subject) || ticketSubject)) {
  console.error(
    "Use a Conventional Commit (fix(games): Align tabs) or the current branch ticket (RELAY-123: Align tabs). See docs/DEVELOPMENT_WORKFLOW.md."
  );
  process.exitCode = 1;
}

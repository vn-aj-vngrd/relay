#!/usr/bin/env node

import { readFileSync } from "node:fs";

const messagePath = process.argv[2];
if (!messagePath) {
  throw new Error("Expected the commit message file path.");
}

const subject = readFileSync(messagePath, "utf8").split("\n", 1)[0].trim();
const conventional =
  /^(build|chore|ci|docs|feat|fix|perf|refactor|revert|style|test)(\([a-z0-9][a-z0-9._/-]*\))?!?: .+$/u;
const generated = /^(Merge |Revert ")/u;

if (!(conventional.test(subject) || generated.test(subject))) {
  console.error(
    "Commit subject must use a conventional prefix, for example: feat(chat): add reactions"
  );
  process.exitCode = 1;
}

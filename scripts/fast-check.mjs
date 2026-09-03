#!/usr/bin/env node

import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import path from "node:path";
import process from "node:process";

const args = new Set(process.argv.slice(2));
const qualityOnly = args.has("--quality-only");
const testsOnly = args.has("--tests-only");

if (qualityOnly && testsOnly) {
  throw new Error("Choose either --quality-only or --tests-only.");
}

const executable = (name) =>
  path.join(
    process.cwd(),
    "node_modules",
    ".bin",
    process.platform === "win32" ? `${name}.cmd` : name
  );

const run = (command, commandArgs) => {
  const result = spawnSync(command, commandArgs, { stdio: "inherit" });
  if (result.error) {
    throw result.error;
  }
  return result.status ?? 1;
};

const gitFiles = (...gitArgs) => {
  const result = spawnSync("git", gitArgs, { encoding: "utf8" });
  if (result.status !== 0) {
    throw new Error(result.stderr.trim() || `git ${gitArgs.join(" ")} failed`);
  }
  return result.stdout.split("\0").filter(Boolean);
};

const changedFiles = [
  ...gitFiles("diff", "--name-only", "--diff-filter=ACMR", "-z", "HEAD"),
  ...gitFiles("ls-files", "--others", "--exclude-standard", "-z"),
];
const uniqueFiles = [...new Set(changedFiles)].filter(existsSync);
const deletedFiles = gitFiles(
  "diff",
  "--name-only",
  "--diff-filter=D",
  "-z",
  "HEAD"
);

const qualityExtensions = new Set([
  ".css",
  ".js",
  ".json",
  ".jsonc",
  ".jsx",
  ".mjs",
  ".ts",
  ".tsx",
]);
const sourceExtensions = new Set([".js", ".jsx", ".mjs", ".ts", ".tsx"]);
const qualityFiles = uniqueFiles.filter((file) =>
  qualityExtensions.has(path.extname(file))
);
const sourceFiles = uniqueFiles.filter((file) =>
  sourceExtensions.has(path.extname(file))
);

const qualityConfigChanged = uniqueFiles.some((file) =>
  ["biome.json", "biome.jsonc", "package.json", "pnpm-lock.yaml"].includes(file)
);
const testConfigChanged = uniqueFiles.some(
  (file) =>
    file === "package.json" ||
    file === "pnpm-lock.yaml" ||
    file === "tsconfig.json" ||
    file === "vitest.setup.ts" ||
    file.startsWith("vitest.config")
);
const deletedSource = deletedFiles.some((file) =>
  sourceExtensions.has(path.extname(file))
);

if (!testsOnly) {
  if (qualityConfigChanged) {
    console.log("Quality configuration changed; checking the full repository.");
    const status = run(executable("ultracite"), ["check"]);
    if (status !== 0) {
      process.exit(status);
    }
  } else if (qualityFiles.length > 0) {
    const status = run(executable("ultracite"), ["check", ...qualityFiles]);
    if (status !== 0) {
      process.exit(status);
    }
  } else {
    console.log("No changed files need a quality check.");
  }
}

if (!qualityOnly) {
  if (testConfigChanged || deletedSource) {
    console.log("Test infrastructure changed; running the full suite.");
    process.exit(run(executable("vitest"), ["run"]));
  }

  if (sourceFiles.length > 0) {
    process.exit(
      run(executable("vitest"), ["related", "--run", ...sourceFiles])
    );
  }

  console.log("No changed source files need tests.");
}

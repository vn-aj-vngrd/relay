import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";

// Package installs in deployment environments do not include Git metadata.
if (existsSync(".git")) {
  const result = spawnSync("lefthook", ["install", "--reset-hooks-path"], {
    stdio: "inherit",
    shell: process.platform === "win32",
  });

  if (result.error) throw result.error;
  if (result.status !== 0) process.exit(result.status ?? 1);
}

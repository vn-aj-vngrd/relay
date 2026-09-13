import { spawnSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import process from "node:process";

const profile = process.argv[2] ?? "essential";
if (!["essential", "full"].includes(profile)) {
  throw new Error("Choose essential or full.");
}
const files = JSON.parse(
  readFileSync(new URL("./reliability-essential.json", import.meta.url), "utf8")
);
for (const file of files) {
  if (!existsSync(file)) {
    throw new Error(`Missing essential regression test: ${file}`);
  }
}
const result = spawnSync(
  path.resolve("node_modules/.bin/vitest"),
  ["run", ...(profile === "full" ? ["--coverage"] : files)],
  { stdio: "inherit" }
);
if (result.error) {
  throw result.error;
}
process.exitCode = result.status ?? 1;

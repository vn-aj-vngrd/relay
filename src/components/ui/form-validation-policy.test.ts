import { readdirSync, readFileSync } from "node:fs";
import { extname, join, relative } from "node:path";

import { describe, expect, it } from "vitest";

const sourceRoot = join(process.cwd(), "src");

function sourceFiles(directory: string): string[] {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) return sourceFiles(path);
    if (extname(entry.name) !== ".tsx" || entry.name.includes(".test.")) return [];
    return [path];
  });
}

describe("form validation policy", () => {
  it("keeps browser-native validation UI disabled on every product form", () => {
    const violations = sourceFiles(sourceRoot).flatMap((path) => {
      const source = readFileSync(path, "utf8");
      return [...source.matchAll(/<form\b[^>]*>/gs)]
        .filter(([openingTag]) => !/\bnoValidate\b/.test(openingTag))
        .map((match) => {
          const line = source.slice(0, match.index).split("\n").length;
          return `${relative(process.cwd(), path)}:${line}`;
        });
    });

    expect(violations, "Forms must use Relay validation feedback instead of browser-native messages").toEqual([]);
  });
});

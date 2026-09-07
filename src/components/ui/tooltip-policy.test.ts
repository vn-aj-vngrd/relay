import { readdirSync, readFileSync } from "node:fs";
import { join, relative } from "node:path";

import ts from "typescript";
import { describe, expect, it } from "vitest";

const root = join(process.cwd(), "src");
function files(directory: string): string[] {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) return files(path);
    return entry.name.endsWith(".tsx") && !entry.name.includes(".test.")
      ? [path]
      : [];
  });
}

describe("app tooltip policy", () => {
  it("keeps tooltip rendering centralized and excludes native title tooltips from React-owned DOM", () => {
    const violations: string[] = [];
    for (const path of files(root)) {
      const source = ts.createSourceFile(
        path,
        readFileSync(path, "utf8"),
        ts.ScriptTarget.Latest,
        true,
        ts.ScriptKind.TSX
      );
      const visit = (node: ts.Node) => {
        if (ts.isJsxOpeningElement(node) || ts.isJsxSelfClosingElement(node)) {
          const tag = node.tagName.getText(source);
          for (const attribute of node.attributes.properties) {
            if (!ts.isJsxAttribute(attribute)) continue;
            const name = attribute.name.getText(source);
            const ownTooltip =
              name === "role" &&
              attribute.initializer &&
              ts.isStringLiteral(attribute.initializer) &&
              attribute.initializer.text === "tooltip";
            const nativeTitle = name === "title" && /^[a-z]/.test(tag);
            if (
              nativeTitle ||
              (ownTooltip && path !== join(root, "components/ui/tooltip.tsx"))
            ) {
              violations.push(
                `${relative(root, path)}: ${nativeTitle ? "native title" : "custom tooltip"}`
              );
            }
          }
        }
        ts.forEachChild(node, visit);
      };
      visit(source);
    }
    expect(violations).toEqual([]);
  });
});

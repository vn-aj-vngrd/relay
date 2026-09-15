import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { expect, it } from "vitest";

it("gives every page a title while leaving the Relay suffix to the root template", () => {
  const pages = readdirSync("src/app", { recursive: true, withFileTypes: true })
    .filter((entry) => entry.name === "page.tsx")
    .map((entry) => join(entry.parentPath, entry.name));
  expect(pages.length).toBeGreaterThan(50);
  for (const page of pages) {
    const source = readFileSync(page, "utf8");
    expect(source, page).toMatch(
      /export (?:const metadata|async function generateMetadata)/
    );
    expect(source, page).not.toMatch(/title:\s*["'`][^"'`]*[·|] Relay["'`]/);
  }
});

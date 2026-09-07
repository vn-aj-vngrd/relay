import { execFileSync } from "node:child_process";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { expect, test } from "@playwright/test";

let directory: string;
let bundle: string;
test.beforeAll(async () => {
  directory = await mkdtemp(join(tmpdir(), "relay-tooltips-"));
  bundle = join(directory, "fixture.js");
  execFileSync("node_modules/.bin/esbuild", [
    "e2e/fixtures/tooltips.tsx",
    "--bundle",
    `--outfile=${bundle}`,
    "--platform=browser",
    '--define:process.env.NODE_ENV="production"',
    "--define:process.env={}",
  ]);
});
test.afterAll(async () => {
  if (directory) await rm(directory, { recursive: true });
});

test("tooltips share portal geometry, animations, focus and reduced motion across app adapters", async ({
  page,
}, testInfo) => {
  const response = await page.goto("/");
  const styles = await page
    .locator('link[rel="stylesheet"], style')
    .evaluateAll((elements) =>
      elements.map((element) => element.outerHTML).join("")
    );
  await page.route("**/__synthetic-tooltip-fixture", (route) =>
    route.fulfill({
      contentType: "text/html",
      headers: {
        "Content-Security-Policy":
          response?.headers()["content-security-policy"] ?? "",
      },
      body: `<html><head><meta name="viewport" content="width=device-width, initial-scale=1">${styles}</head><body></body></html>`,
    })
  );
  await page.goto("/__synthetic-tooltip-fixture");
  await page.addScriptTag({ path: bundle });

  for (const width of [390, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    for (const theme of ["light", "dark"]) {
      await page.evaluate((value) => {
        document.documentElement.dataset.theme = value;
      }, theme);
      for (const reducedMotion of ["no-preference", "reduce"] as const) {
        await page.emulateMedia({ reducedMotion });
        const controls =
          width >= 1024
            ? ["More game actions", "Sidebar inbox", "Open sidebar"]
            : ["More game actions", "Open sidebar"];
        for (const name of controls) {
          const trigger = page.getByRole("button", { name, exact: true });
          await trigger.focus();
          const tooltip = page.getByRole("tooltip");
          await expect(tooltip).toBeVisible();
          const metrics = await tooltip.evaluate((element) => {
            const bounds = element.getBoundingClientRect();
            const surface = element.firstElementChild!;
            const style = getComputedStyle(surface);
            return {
              left: bounds.left,
              right: bounds.right,
              top: bounds.top,
              bottom: bounds.bottom,
              parent: element.parentElement?.tagName,
              animation: style.animationName,
              duration: style.animationDuration,
            };
          });
          expect(metrics.parent).toBe("BODY");
          expect(metrics.left).toBeGreaterThanOrEqual(8);
          expect(metrics.right).toBeLessThanOrEqual(width - 8);
          expect(metrics.top).toBeGreaterThanOrEqual(8);
          expect(metrics.bottom).toBeLessThanOrEqual(892);
          expect(metrics.animation).toBe(
            reducedMotion === "reduce"
              ? "menu-popover-fade-in"
              : "menu-popover-enter"
          );
          if (reducedMotion === "reduce")
            expect(Number.parseFloat(metrics.duration)).toBeLessThanOrEqual(
              0.08
            );
          else expect(metrics.duration).toBe("0.18s");
          if (reducedMotion === "no-preference")
            await page.screenshot({
              path: testInfo.outputPath(
                `${width}-${theme}-${name.replaceAll(" ", "-")}.png`
              ),
              animations: "disabled",
            });
          await page.keyboard.press("Escape");
          await expect(tooltip).toHaveCount(0);
          await expect(trigger).toBeFocused();
          await trigger.evaluate((element) => (element as HTMLElement).blur());
        }
      }
    }
  }
});

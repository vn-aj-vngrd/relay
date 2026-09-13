import { execFileSync } from "node:child_process";
import { mkdtemp, readFile, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { expect, test } from "@playwright/test";

let bundle: string;
const cases: { name: string; className: string; emptyClassName?: string }[] =
  [];
test.beforeAll(async () => {
  const directory = await mkdtemp(join(tmpdir(), "relay-game-layout-"));
  const tour = join(directory, "application-tour.tsx");
  // Only the server mutation is stubbed; execute the real tour/rendering code.
  await writeFile(
    tour,
    (
      await readFile("src/features/onboarding/application-tour.tsx", "utf8")
    ).replace(
      'import { completeProductTour } from "./actions";',
      "const completeProductTour = async () => undefined;"
    )
  );
  bundle = join(directory, "fixture.js");
  execFileSync("node_modules/.bin/esbuild", [
    "e2e/fixtures/game-layout.tsx",
    "--bundle",
    `--outfile=${bundle}`,
    "--platform=browser",
    "--jsx=automatic",
    "--alias:@=./src",
    "--alias:react=./node_modules/react",
    "--alias:@phosphor-icons/react=./node_modules/@phosphor-icons/react",
    `--alias:@/features/onboarding/application-tour=${tour}`,
    "--alias:next/navigation=./e2e/fixtures/layout-navigation.ts",
    '--define:process.env.NODE_ENV="production"',
    "--define:process.env={}",
  ]);
  const frame = await readFile(
    "src/features/sessions/game-workspace-frame.tsx",
    "utf8"
  );
  const frameClass = frame.match(
    /className="(game-workspace-content [^"]+)"/
  )?.[1];
  if (!frameClass) throw new Error("Authenticated tab container missing");
  for (const tab of ["(plan)", "play", "chat", "payments", "story"]) {
    for (const state of ["page", "loading"]) {
      cases.push({ name: `private/${tab}/${state}`, className: frameClass });
      const source = await readFile(
        `src/app/s/[slug]/${tab}/${state}.tsx`,
        "utf8"
      );
      const containers = [
        ...source.matchAll(/className="([^"]*game-tab-content[^"]*)"/g),
      ];
      if (!containers.length)
        throw new Error(`Shared ${tab}/${state} container missing`);
      for (const [index, match] of containers.entries()) {
        cases.push({
          name: `shared/${index}/${tab}/${state}`,
          className: match[1],
          ...(tab === "payments" && state === "page" && index === 0
            ? {
                emptyClassName: source.match(
                  /game-tab-content[^"]*">\s*<section className="([^"]+)"/
                )?.[1],
              }
            : {}),
        });
      }
    }
  }
});

for (const width of [390, 1440]) {
  test(`game tabs and tour retain rendered spacing at ${width}px`, async ({
    page,
  }, testInfo) => {
    await page.setViewportSize({ width, height: 900 });
    await page.goto("/");
    const styles = await page
      .locator('link[rel="stylesheet"], style')
      .evaluateAll((elements) =>
        elements.map((element) => element.outerHTML).join("")
      );
    await page.route("**/__synthetic-game-layout*", (route) =>
      route.fulfill({
        contentType: "text/html",
        body: `<html><head><meta name="viewport" content="width=device-width, initial-scale=1">${styles}</head><body><script type="application/json" id="layout-cases">${JSON.stringify(cases)}</script></body></html>`,
      })
    );
    await page.goto("/__synthetic-game-layout");
    await page.addScriptTag({ path: bundle });
    await expect(page.locator("[data-layout-case]")).toHaveCount(cases.length);
    await page.evaluate(() => document.fonts.ready);
    const expected = width < 640 ? 12 : 16;
    const offsets = await page
      .locator("[data-layout-case]")
      .evaluateAll((items) =>
        items.map((item) => {
          const edge = item
            .querySelector("[data-tab-edge]")!
            .getBoundingClientRect();
          const content = item
            .querySelector("h2, [data-first-content]")!
            .getBoundingClientRect();
          return {
            name: item.getAttribute("data-layout-case"),
            gap: content.top - edge.bottom,
          };
        })
      );
    for (const offset of offsets)
      expect(offset.gap, offset.name ?? "tab").toBe(expected);
    for (const ended of await page.locator("[data-ended-case]").all()) {
      const gap = await ended.evaluate(
        (item) =>
          item.querySelector("h2")!.getBoundingClientRect().top -
          item.querySelector("[data-recap-edge]")!.getBoundingClientRect()
            .bottom
      );
      expect(gap).toBeGreaterThanOrEqual(20);
      expect(
        await ended
          .locator("section")
          .evaluate((element) => getComputedStyle(element).paddingTop)
      ).toBe("20px");
    }
    const paymentEmpty = page.locator("[data-payment-empty]");
    await expect(paymentEmpty).toHaveCount(1);
    expect(
      await paymentEmpty.evaluate(
        (element) =>
          element
            .querySelector("[data-payment-message]")!
            .getBoundingClientRect().top - element.getBoundingClientRect().top
      )
    ).toBe(40);
    for (const next of ["/home", "/games/saved-game"]) {
      await page.goto(
        `/__synthetic-game-layout?mode=tour&next=${encodeURIComponent(next)}`
      );
      await page.addScriptTag({ path: bundle });
      for (let step = 0; step < 4; step++)
        await page.getByRole("button", { name: "Next", exact: true }).click();
      const dialog = page.getByRole("dialog");
      const create = page.getByRole("button", {
        name: "Create game",
        exact: true,
      });
      await expect(create).toBeFocused();
      const secondary = page.getByRole("button", {
        name: next === "/home" ? "Explore Relay" : "Open saved game",
      });
      const bounds = await dialog.boundingBox();
      const primary = await create.boundingBox();
      const secondaryBounds = await secondary.boundingBox();
      expect(bounds && primary && secondaryBounds).toBeTruthy();
      expect(primary!.y).toBeGreaterThanOrEqual(
        secondaryBounds!.y + secondaryBounds!.height
      );
      for (const button of await dialog.getByRole("button").all()) {
        const box = await button.boundingBox();
        expect(box!.x).toBeGreaterThanOrEqual(bounds!.x);
        expect(box!.x + box!.width).toBeLessThanOrEqual(
          bounds!.x + bounds!.width
        );
        expect(box!.y + box!.height).toBeLessThanOrEqual(
          bounds!.y + bounds!.height
        );
      }
      await dialog.screenshot({
        path: testInfo.outputPath(
          `tour-${next === "/home" ? "explore" : "saved"}.png`
        ),
      });
    }
  });
}

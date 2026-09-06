import { execFileSync } from "node:child_process";
import { mkdtemp, readFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { expect, test } from "@playwright/test";

let bundle: string;
test.beforeAll(async () => {
  bundle = join(await mkdtemp(join(tmpdir(), "relay-creative-")), "fixture.js");
  // Use the installed Vite/esbuild toolchain; no fixture route or auth bypass.
  execFileSync("node_modules/.bin/esbuild", [
    "e2e/fixtures/story-creative.tsx",
    "--bundle",
    `--outfile=${bundle}`,
    "--platform=browser",
    "--alias:next/image=./e2e/fixtures/story-image.ts",
    '--define:process.env.NODE_ENV="production"',
    "--define:process.env={}",
    "--alias:@/features/analytics/actions=./e2e/fixtures/story-analytics.ts",
  ]);
});

test("expressive real Story components fit long facts and export every theme", async ({
  page,
}, testInfo) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  const response = await page.goto("/");
  const styles = await page
    .locator('link[rel="stylesheet"], style')
    .evaluateAll((elements) =>
      elements.map((element) => element.outerHTML).join("")
    );
  // Browser-only document uses real compiled app CSS but no Next hydration,
  // Lenis, analytics, or account state. It is not a repository route.
  await page.route("**/__synthetic-story-fixture", (route) =>
    route.fulfill({
      contentType: "text/html",
      headers: {
        "Content-Security-Policy":
          response?.headers()["content-security-policy"] ?? "",
      },
      body: `<html><head><meta name="viewport" content="width=device-width, initial-scale=1">${styles}</head><body></body></html>`,
    })
  );
  await page.goto("/__synthetic-story-fixture");
  await page.addStyleTag({
    content: await readFile(bundle.replace(/\.js$/, ".css"), "utf8"),
  });
  await page.addScriptTag({ path: bundle });
  await expect(page.locator("#theme-sheet [data-story-theme]")).toHaveCount(5);
  await page.evaluate(() => document.fonts.ready);
  await page
    .locator("#theme-sheet")
    .screenshot({ path: testInfo.outputPath("five-theme-contact-sheet.png") });
  for (const width of [199, 280, 430]) {
    await page
      .locator("#stress-sheet section")
      .evaluateAll((elements, size) => {
        for (const element of elements)
          (element as HTMLElement).style.width = `${size}px`;
      }, width);
    await expect
      .poll(() =>
        page.locator("#stress-sheet [data-story-theme]").evaluateAll((cards) =>
          cards.every((card) => {
            const header = card
              .querySelector('[data-story-region="header"]')!
              .getBoundingClientRect();
            const frame = card
              .querySelector('[data-story-region="facts"]')!
              .getBoundingClientRect();
            const facts = card
              .querySelector("[data-story-fitted-content]")!
              .getBoundingClientRect();
            const headerElement = card.querySelector(
              '[data-story-region="header"]'
            )!;
            const range = document.createRange();
            range.selectNodeContents(headerElement);
            const headerText = range.getBoundingClientRect();
            const cardBounds = card.getBoundingClientRect();
            return (
              headerText.bottom <=
                cardBounds.top + cardBounds.height * (136 / 1920) &&
              header.bottom < frame.top &&
              facts.top >= frame.top - 1 &&
              facts.bottom <= frame.bottom + 1
            );
          })
        )
      )
      .toBe(true);
  }
  await page
    .locator("#stress-sheet")
    .screenshot({ path: testInfo.outputPath("long-crew-contact-sheet.png") });
  // Contact sheets deliberately scroll sideways; remove them before auditing
  // the actual narrow editor rather than confusing fixture overflow with UI.
  await page.locator("#theme-sheet, #stress-sheet").evaluateAll((elements) => {
    for (const element of elements) element.remove();
  });
  const photo = await page.evaluate(() => {
    const canvas = document.createElement("canvas");
    canvas.width = 720;
    canvas.height = 1280;
    const context = canvas.getContext("2d")!;
    context.fillStyle = "#477462";
    context.fillRect(0, 0, 720, 1280);
    context.strokeStyle = "#fff8e9";
    context.lineWidth = 12;
    context.strokeRect(70, 170, 580, 940);
    context.beginPath();
    context.moveTo(70, 640);
    context.lineTo(650, 640);
    context.stroke();
    context.fillStyle = "#dcec69";
    context.beginPath();
    context.arc(480, 380, 65, 0, Math.PI * 2);
    context.fill();
    return canvas.toDataURL("image/png").split(",")[1];
  });
  await page.getByText("Customize story", { exact: true }).click();
  for (const label of [
    "Minimal",
    "Scrapbook",
    "Coquette",
    "Court Pop",
    "Retro Rally",
  ]) {
    await page.getByRole("button", { name: "Layout", exact: true }).click();
    await page.getByRole("button", { name: label, exact: true }).click();
    await page.getByRole("button", { name: "Background", exact: true }).click();
    await page.getByRole("button", { name: "Pink background" }).click();
    for (const withPhoto of [false, true]) {
      if (withPhoto) {
        await page.getByLabel("Choose background photo file").setInputFiles({
          name: "synthetic-court.png",
          mimeType: "image/png",
          buffer: Buffer.from(photo, "base64"),
        });
        await expect(page.getByRole("status")).toContainText(
          "hasn’t been uploaded"
        );
      }
      const download = page.waitForEvent("download");
      await page
        .getByRole("button", { name: "Download PNG", exact: true })
        .click();
      const file = await download;
      const path = testInfo.outputPath(
        `${label}-${withPhoto ? "photo" : "pink"}.png`
      );
      await file.saveAs(path);
      const png = await readFile(path);
      expect([png.readUInt32BE(16), png.readUInt32BE(20)]).toEqual([
        1080, 1920,
      ]);
      await expect(page.getByRole("status")).toContainText("1080 × 1920");
    }
  }
  expect(
    await page.evaluate(() => document.documentElement.scrollWidth)
  ).toBeLessThanOrEqual(page.viewportSize()!.width);
  await page.setViewportSize({ width: 667, height: 375 });
  await page.getByRole("button", { name: "Expand story preview" }).click();
  const dialog = page.getByRole("dialog");
  await page.screenshot({
    path: testInfo.outputPath("expanded-phone-top.png"),
  });
  await dialog
    .getByRole("button", { name: "Download PNG" })
    .scrollIntoViewIfNeeded();
  await expect(
    dialog.getByRole("button", { name: "Download PNG" })
  ).toBeInViewport();
  await page.screenshot({
    path: testInfo.outputPath("expanded-phone-actions.png"),
  });
});

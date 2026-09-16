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
  for (const card of await page
    .locator("#theme-sheet [data-story-theme]")
    .all()) {
    const heading = card.locator('[data-story-fact="headline"]');
    await expect(heading.locator("tspan")).toHaveCount(1);
    await expect(heading).toHaveText("vanajvanguardia");
  }
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
            const header = card.querySelector(
              '[data-story-region="header"] text'
            )!;
            const headerBounds = header.getBoundingClientRect();
            const cardBounds = card.getBoundingClientRect();
            const facts = [...card.querySelectorAll("[data-story-fact]")];
            return (
              facts.length > 0 &&
              headerBounds.bottom <=
                cardBounds.top + cardBounds.height * (136 / 1920) &&
              facts.every((fact) => {
                const bounds = fact.getBoundingClientRect();
                return (
                  bounds.left >= cardBounds.left &&
                  bounds.right <= cardBounds.right &&
                  bounds.top > headerBounds.bottom &&
                  bounds.bottom <= cardBounds.bottom
                );
              })
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
  const editor = page.getByRole("group", { name: "Story editor", exact: true });
  const section = async (name: string) =>
    editor.getByRole("button", { name, exact: true }).click();
  await expect(editor.getByRole("button")).toHaveCount(4);
  await expect(page.getByText("Customize story", { exact: true })).toHaveCount(
    0
  );
  await expect(
    page.getByRole("button", { name: "Add your photo to this memory" })
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Download PNG", exact: true })
  ).toBeDisabled();
  await section("Look");
  await expect(
    page.getByRole("button", { name: "Court Pop", exact: true })
  ).toHaveAttribute("aria-pressed", "true");
  await expect(
    page.getByRole("group", { name: "Story theme" }).getByRole("button")
  ).toHaveCount(5);
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
  await section("Details");
  await page
    .getByLabel("Your caption", { exact: true })
    .fill("Our Saturday crew.");
  await section("Photos");
  const upload = async (names: string[]) => {
    await section("Photos");
    await page.getByLabel("Choose story photo file").setInputFiles(
      names.map((name) => ({
        name: `${name}.png`,
        mimeType: "image/png",
        buffer: Buffer.from(photo, "base64"),
      }))
    );
    await expect(page.getByRole("status")).toContainText(
      "Nothing was uploaded"
    );
  };
  const downloadStory = async (name: string) => {
    const downloaded = page.waitForEvent("download");
    await page
      .getByRole("button", { name: "Download PNG", exact: true })
      .click();
    const path = testInfo.outputPath(name);
    await (await downloaded).saveAs(path);
    const png = await readFile(path);
    expect([png.readUInt32BE(16), png.readUInt32BE(20)]).toEqual([1080, 1920]);
  };
  await upload(["memory-court"]);
  await expect(
    page.getByRole("button", { name: "Add your photo to this memory" })
  ).toHaveCount(0);
  await expect(page.locator('[data-story-region="photo-stats"]')).toBeVisible();
  await section("Details");
  await page.getByRole("checkbox", { name: "Show game stats" }).uncheck();
  await expect(page.locator('[data-story-region="photo-stats"]')).toHaveCount(
    0
  );
  await downloadStory("photo-memory-without-stats.png");
  await page.getByRole("checkbox", { name: "Show game stats" }).check();
  await downloadStory("photo-memory.png");
  await section("Photos");
  await page.getByRole("button", { name: /^Edit photo 1:/ }).click();
  await page.getByRole("button", { name: "Remove photo", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "Add your photo to this memory" })
  ).toBeVisible();
  await section("Details");
  await expect(page.getByLabel("Your caption", { exact: true })).toHaveValue(
    "Our Saturday crew."
  );
  await page.getByRole("button", { name: "Game recap", exact: true }).click();
  for (const look of [
    "Studio",
    "Scrapbook",
    "Soft Serve",
    "Court Pop",
    "Clubhouse",
  ]) {
    await section("Photos");
    if (await page.getByRole("button", { name: /^Edit photo 1:/ }).count()) {
      await page.getByRole("button", { name: /^Edit photo 1:/ }).click();
      await page
        .getByRole("button", { name: "Remove photo", exact: true })
        .click();
    }
    await section("Look");
    await page.getByRole("button", { name: look, exact: true }).click();
    await page.getByRole("button", { name: "Baby Pink background" }).click();
    await downloadStory(`${look}-pink.png`);
    await upload(["synthetic-court"]);
    await section("Layout");
    await page.getByRole("button", { name: "Framed foreground" }).click();
    await section("Photos");
    await page.getByRole("button", { name: /^Edit photo 1:/ }).click();
    await page.getByLabel("Horizontal crop", { exact: true }).press("End");
    for (const [placement, label] of [
      ["top", "Photo first"],
      ["center", "Balanced"],
      ["bottom", "Details first"],
    ]) {
      await section("Layout");
      await page
        .getByRole("group", { name: "Photo placement options" })
        .getByRole("button", { name: label, exact: true })
        .click();
      const card = page.locator("[data-story-theme]");
      await expect(card).toHaveAttribute("data-photo-placement", placement);
      await expect
        .poll(() =>
          card.evaluate((element) => {
            const photoBounds = element
              .querySelector('[data-story-region="photo"]')!
              .getBoundingClientRect();
            return [...element.querySelectorAll("[data-story-fact]")].every(
              (fact) => {
                const bounds = fact.getBoundingClientRect();
                return (
                  photoBounds.bottom <= bounds.top ||
                  bounds.bottom <= photoBounds.top
                );
              }
            );
          })
        )
        .toBe(true);
      await downloadStory(`${look}-${placement}.png`);
    }
    await page.getByRole("button", { name: "Full background" }).click();
    await expect(page.locator('[data-story-region="theme-art"]')).toHaveCount(
      0
    );
    await downloadStory(`${look}-background.png`);
  }
  await upload(["action", "crew", "paddles"]);
  await expect(page.locator('[data-story-region="photo"]')).toHaveCount(4);
  await page.getByRole("button", { name: /^Edit photo 2:/ }).click();
  await page.getByLabel("Photo zoom", { exact: true }).press("End");
  await page.getByRole("button", { name: "Move earlier", exact: true }).click();
  await section("Layout");
  await page
    .getByRole("button", { name: "Contact sheet", exact: true })
    .click();
  await section("Look");
  for (const look of [
    "Court Pop",
    "Scrapbook",
    "Studio",
    "Soft Serve",
    "Clubhouse",
  ]) {
    await page.getByRole("button", { name: look, exact: true }).click();
    await expect(page.locator('[data-story-region="photo"]')).toHaveCount(4);
    await downloadStory(`collage-${look}.png`);
  }
  await section("Layout");
  await page.getByRole("button", { name: "More layouts", exact: true }).click();
  for (const [label, layout] of [
    ["Photo callouts", "callouts"],
    ["Star scrapbook", "scrapbook"],
    ["Camera roll", "camera"],
  ]) {
    await page.getByRole("button", { name: label, exact: true }).click();
    await expect(page.locator(`[data-story-collage="${layout}"]`)).toHaveCount(
      1
    );
    await expect(page.locator('[data-story-region="photo"]')).toHaveCount(4);
    await downloadStory(`creative-${layout}.png`);
  }
  expect(
    await page.evaluate(() => document.documentElement.scrollWidth)
  ).toBeLessThanOrEqual(page.viewportSize()!.width);
  const exportActions = page.getByRole("group", {
    name: "Story export actions",
  });
  const editorControls = page.getByRole("region", {
    name: "Story editor controls",
  });
  for (const viewport of [
    { width: 375, height: 667 },
    { width: 390, height: 844 },
    { width: 667, height: 375 },
  ]) {
    await page.setViewportSize(viewport);
    for (const panel of ["Photos", "Layout", "Look", "Details"]) {
      await section(panel);
      await editor.scrollIntoViewIfNeeded();
      const controlsBounds = await editorControls.boundingBox();
      const actionsBounds = await exportActions.boundingBox();
      expect(controlsBounds).not.toBeNull();
      expect(actionsBounds).not.toBeNull();
      expect(actionsBounds!.y).toBeGreaterThanOrEqual(
        controlsBounds!.y + controlsBounds!.height
      );
      await exportActions.scrollIntoViewIfNeeded();
      await expect(
        exportActions.getByRole("button", { name: "Share Story", exact: true })
      ).toBeInViewport();
      await expect(
        exportActions.getByRole("button", { name: "Download PNG", exact: true })
      ).toBeInViewport();
    }
  }
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

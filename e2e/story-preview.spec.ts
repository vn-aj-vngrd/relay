import { readFile } from "node:fs/promises";
import { expect, test } from "@playwright/test";

for (const viewport of [
  { width: 667, height: 375 },
  { width: 320, height: 568 },
]) {
  test(`expanded Story standings remain readable at ${viewport.width} × ${viewport.height}`, async ({
    page,
  }) => {
    // Reuse the real landing-page RecapStoryCard standings example (synthetic
    // data) and actual workspace CSS in a media-dialog-sized native fixture.
    // This exercises real rendered content, not authenticated editor wiring.
    const markup = `<dialog aria-label="Synthetic Story preview" style="margin:auto;width:calc(100vw - 2rem);max-width:72rem;max-height:calc(100dvh - 2rem);padding:0;border:0;background:transparent;color:white">
      <div class="expanded">
        <h2>Synthetic Story preview</h2>
        <button type="button">Close expanded story</button>
        <div class="expandedPortrait"></div>
        <div class="actions"><button type="button">Share story</button><button type="button">Download PNG</button></div>
      </div>
    </dialog>`;
    await page.setViewportSize(viewport);
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/");
    await expect(
      page.locator('[aria-label="standings social recap preview"]').first()
    ).toBeAttached();
    await page.addStyleTag({
      content: await readFile(
        new URL(
          "../src/features/memories/story-workspace.module.css",
          import.meta.url
        ),
        "utf8"
      ),
    });
    await page.evaluate((html) => {
      const example = document.querySelector(
        '[aria-label="standings social recap preview"]'
      );
      if (!example) throw new Error("Missing real Story standings example");
      const card = example.cloneNode(true) as HTMLElement;
      // Remove only the marketing rail's minimum width/rotation treatment.
      card.style.minWidth = "0";
      card.style.transform = "none";
      card.style.rotate = "none";
      card.style.width = "100%";
      const fixture = document.createElement("div");
      fixture.innerHTML = html;
      fixture.querySelector(".expandedPortrait")?.append(card);
      document.body.append(fixture);
      fixture.querySelector("dialog")?.showModal();
    }, markup);
    const dialog = page.getByRole("dialog", {
      name: "Synthetic Story preview",
    });
    await expect(dialog).toHaveCSS("opacity", "1");
    const card = dialog.locator('[aria-roledescription="slide"]');
    const size = await card.boundingBox();
    expect(size!.width).toBeCloseTo(Math.min(viewport.width - 40, 430), 0);
    expect(size!.width / size!.height).toBeCloseTo(9 / 16, 2);
    expect(await card.locator("li").count()).toBe(4);
    expect(
      await card.evaluate((element) => {
        const bounds = element.getBoundingClientRect();
        return [...element.querySelectorAll("li")].every((row) => {
          const rect = row.getBoundingClientRect();
          const name = row.querySelector("strong");
          return (
            rect.left >= bounds.left &&
            rect.right <= bounds.right &&
            rect.top >= bounds.top &&
            rect.bottom <= bounds.bottom &&
            name !== null &&
            name.scrollWidth <= name.clientWidth
          );
        });
      })
    ).toBe(true);
    const download = dialog.getByRole("button", { name: "Download PNG" });
    await download.scrollIntoViewIfNeeded();
    const actionBounds = await download.boundingBox();
    expect(actionBounds!.y + actionBounds!.height).toBeLessThanOrEqual(
      viewport.height
    );
    expect(
      await dialog
        .locator(".expanded")
        .evaluate((element) => element.scrollHeight > element.clientHeight)
    ).toBe(true);
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth)
    ).toBeLessThanOrEqual(viewport.width);
    await dialog
      .getByRole("button", { name: "Close expanded story" })
      .scrollIntoViewIfNeeded();
    await page.keyboard.press("Escape");
    await expect(dialog).not.toBeVisible();
  });
}

import { expect, test } from "@playwright/test";

for (const width of [390, 1440]) {
  test(`landing roster is keyboard and pointer accessible at ${width}px`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.goto("/");
    const carousel = page.getByRole("region", {
      name: "A Relay game from overview to story",
    });
    await carousel
      .getByRole("button", { name: "Show Play", exact: true })
      .click();
    const players = carousel.getByRole("button", {
      name: "Players (8)",
      exact: true,
    });
    await players.click();
    const roster = page.getByRole("dialog", {
      name: "Players (8)",
      exact: true,
    });
    await expect(roster).toBeVisible();
    await expect(
      roster.getByRole("heading", { name: "Going", exact: true })
    ).toBeVisible();
    await page.clock.install();
    await page.clock.fastForward(13000);
    await expect(roster).toBeVisible();
    await expect(
      carousel.getByRole("button", { name: "Show Play", exact: true })
    ).toHaveAttribute("aria-current", "true");
    await page.keyboard.press("Escape");
    await expect(roster).not.toBeVisible();
    await expect(players).toBeFocused();
    await page.keyboard.press("Enter");
    await expect(roster).toBeVisible();
    await roster.getByRole("button", { name: "Close players" }).click();
    await expect(players).toBeFocused();
    await expect(
      carousel.locator(".marketing-hero-slide-content")
    ).toHaveAttribute("inert", "");
  });
}

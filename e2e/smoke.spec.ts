import { expect, test } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

test("protected routes send signed-out users to a usable login", async ({ page }) => {
  await page.goto("/");
  expect(new URL(page.url()).pathname).toBe("/login");
  expect(new URL(page.url()).searchParams.get("next")).toBe("/");
  await expect(page.getByRole("heading", { name: "Welcome to Relay" })).toBeVisible();
  await expect(page.locator("#magic-email")).toBeVisible();
  await expect(page.getByRole("button", { name: "Email me a sign-in link" })).toBeVisible();
  await expect(page.getByText("Continue with Google")).toHaveCount(0);
});

test("login has no serious accessibility violations", async ({ page }) => {
  await page.goto("/login");
  const results = await new AxeBuilder({ page }).analyze();
  expect(results.violations.filter((item) => ["serious", "critical"].includes(item.impact ?? ""))).toEqual([]);
});

test("keyboard users can skip directly to the main content", async ({ page }) => {
  await page.goto("/login");
  await page.keyboard.press("Tab");
  const skip = page.getByRole("link", { name: "Skip to content" });
  await expect(skip).toBeFocused();
  await skip.press("Enter");
  await expect(page).toHaveURL(/#main-content$/);
});

test("core public and protected routes fail safely", async ({ page }) => {
  await page.goto("/games/new");
  expect(new URL(page.url()).pathname).toBe("/login");
  await page.goto("/s/session-that-does-not-exist");
  await expect(page.getByRole("heading", { name: "This game isn’t here." })).toBeVisible({
    timeout: 15_000,
  });
});

test("mobile layout has no horizontal overflow and keeps primary targets usable", async ({ page }, testInfo) => {
  test.skip(!testInfo.project.name.startsWith("mobile"), "mobile-only validation");
  await page.goto("/login");
  expect(await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)).toBe(0);
  const button = page.getByRole("button", { name: "Email me a sign-in link" });
  const box = await button.boundingBox();
  expect(box?.height).toBeGreaterThanOrEqual(44);
  const brand = page.getByRole("link", { name: "Relay home" });
  expect((await brand.boundingBox())?.height).toBeGreaterThanOrEqual(44);
});

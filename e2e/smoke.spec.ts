import { expect, test } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

test("protected routes send signed-out users to a usable login", async ({ page }) => {
  await page.goto("/");
  expect(new URL(page.url()).pathname).toBe("/login");
  expect(new URL(page.url()).searchParams.get("next")).toBe("/");
  await expect(page.getByRole("heading", { name: "Welcome back" })).toBeVisible();
  await expect(page.locator("#password-email")).toBeVisible();
  await expect(page.locator("#password")).toBeVisible();
  await expect(page.locator("form").getByRole("button", { name: "Sign in" })).toBeVisible();
  await expect(page.locator('[aria-label="Authentication method"]').getByRole("button", { name: "Create account" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Use dark mode" })).toBeVisible();
  await expect(page.getByText("Continue with Google")).toHaveCount(0);
});

test("a new user can create an account and reach the authenticated home", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name.startsWith("mobile"), "single-project auth mutation");
  test.skip(!process.env.E2E_AUTH_EMAIL || !process.env.E2E_AUTH_PASSWORD, "requires disposable auth credentials");

  await page.goto("/login");
  await page.locator('[aria-label="Authentication method"]').getByRole("button", { name: "Create account" }).click();
  await page.locator("#password-email").fill(process.env.E2E_AUTH_EMAIL!);
  await page.locator("#password").fill(process.env.E2E_AUTH_PASSWORD!);
  await page.locator("form").getByRole("button", { name: "Create account" }).click();

  await expect(page).toHaveURL(/\/$/, { timeout: 15_000 });
  await expect(page.getByRole("heading", { name: /next game/i })).toBeVisible();

  await page.getByRole("link", { name: "Profile" }).click();
  await page.getByRole("button", { name: "Sign out" }).click();
  await expect(page).toHaveURL(/\/login$/);

  await page.locator("#password-email").fill(process.env.E2E_AUTH_EMAIL!);
  await page.locator("#password").fill(process.env.E2E_AUTH_PASSWORD!);
  await page.locator("form").getByRole("button", { name: "Sign in" }).click();
  await expect(page).toHaveURL(/\/$/, { timeout: 15_000 });
  await expect(page.getByRole("heading", { name: /next game/i })).toBeVisible();
});

test("login switches between sign in and account creation", async ({ page }) => {
  await page.goto("/login");
  await page.locator('[aria-label="Authentication method"]').getByRole("button", { name: "Create account" }).click();
  await expect(page.getByRole("heading", { name: "Join your next game" })).toBeVisible();
  await expect(page.locator("#password")).toHaveAttribute("autocomplete", "new-password");
});

test("light mode is default and dark mode persists", async ({ page }) => {
  await page.goto("/login");
  await expect(page.locator("html")).toHaveAttribute("data-theme", "light");
  await page.getByRole("button", { name: "Use dark mode" }).click();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  await page.reload();
  await expect(page.getByRole("button", { name: "Use light mode" })).toBeVisible();
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
  const button = page.locator("form").getByRole("button", { name: "Sign in" });
  const box = await button.boundingBox();
  expect(box?.height).toBeGreaterThanOrEqual(44);
  const brand = page.getByRole("link", { name: "Relay home" });
  expect((await brand.boundingBox())?.height).toBeGreaterThanOrEqual(44);
});

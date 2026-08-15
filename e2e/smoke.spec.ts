import { expect, test } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

test("protected routes send signed-out users to a usable login", async ({ page }, testInfo) => {
  await page.goto("/");
  expect(new URL(page.url()).pathname).toBe("/login");
  expect(new URL(page.url()).searchParams.get("next")).toBe("/");
  await expect(page.getByRole("heading", { name: "Welcome back" })).toBeVisible();
  await expect(page.locator("#password-email")).toBeVisible();
  await expect(page.locator("#password")).toBeVisible();
  await expect(page.locator("form").getByRole("button", { name: "Sign in" })).toBeVisible();
  await expect(page.locator('[aria-label="Authentication method"]').getByRole("button", { name: "Create account" })).toBeVisible();
  if (testInfo.project.name.startsWith("mobile")) {
    await expect(page.getByRole("heading", { name: "Built for friendly game nights" })).toBeVisible();
    await expect(page.getByText("A little organization, without leagues or rankings.")).toBeVisible();
  } else {
    await expect(page.getByText(/No leagues, ladders, or ratings/)).toBeVisible();
  }
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
  await page.getByRole("button", { name: "Use dark mode" }).click();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  await page.getByRole("button", { name: "Use light mode" }).click();
  await page.getByRole("button", { name: "Sign out" }).click();
  await expect(page).toHaveURL(/\/login$/);

  await page.locator("#password-email").fill(process.env.E2E_AUTH_EMAIL!);
  await page.locator("#password").fill(process.env.E2E_AUTH_PASSWORD!);
  await page.locator("form").getByRole("button", { name: "Sign in" }).click();
  await expect(page).toHaveURL(/\/$/, { timeout: 15_000 });
  await expect(page.getByRole("heading", { name: /next game/i })).toBeVisible();
  const desktopCreate = await page.getByRole("navigation", { name: "Main navigation" }).getByRole("link", { name: "Create" }).boundingBox();
  expect(desktopCreate).not.toBeNull();
  expect(desktopCreate!.x).toBeLessThan(240);

  await page.goto("/games");
  await page.getByRole("button", { name: "Grid view" }).click();
  await expect(page.getByRole("button", { name: "Grid view" })).toHaveAttribute("aria-pressed", "true");
  await page.reload();
  await expect(page.getByRole("button", { name: "Grid view" })).toHaveAttribute("aria-pressed", "true");
  await page.getByRole("button", { name: "Calendar view" }).click();
  await expect(page.getByTestId("games-calendar")).toBeVisible();
  await page.reload();
  await expect(page.getByRole("button", { name: "Calendar view" })).toHaveAttribute("aria-pressed", "true");

  await page.setViewportSize({ width: 320, height: 700 });
  await page.goto("/");
  const mobileNav = await page.getByRole("navigation", { name: "Main navigation" }).boundingBox();
  expect(mobileNav).not.toBeNull();
  expect(mobileNav!.x).toBeGreaterThanOrEqual(0);
  expect(mobileNav!.x + mobileNav!.width).toBeLessThanOrEqual(320);

  await page.goto("/games/new");
  await expect(page.getByRole("navigation", { name: "Main navigation" })).toHaveCount(0);
  const date = await page.locator("#date").boundingBox();
  const capacity = await page.locator("#capacity").boundingBox();
  const start = await page.locator("#start").boundingBox();
  const end = await page.locator("#end").boundingBox();
  for (const field of [date, capacity, start, end]) {
    expect(field).not.toBeNull();
    expect(field!.x + field!.width).toBeLessThanOrEqual(320);
  }
  expect(date!.y + date!.height).toBeLessThanOrEqual(capacity!.y);
  expect(start!.y + start!.height).toBeLessThanOrEqual(end!.y);

  await page.locator("#venue").fill("Central Pickle");
  await page.locator("#courts").fill("21");
  await page.getByRole("button", { name: "Publish game" }).click();
  await expect(page.getByText("Relay supports up to 20 courts per session.")).toBeVisible();
  await expect(page.locator("#courts")).toBeFocused();
  await expect(page.locator("#venue")).toHaveValue("Central Pickle");

  await page.locator("#courts").fill("2");
  await page.getByRole("button", { name: "Publish game" }).click();
  await expect(page).toHaveURL(/\/games\/[0-9a-f-]+$/, { timeout: 15_000 });
  const sessionId = new URL(page.url()).pathname.split("/").at(-1);
  await page.goto(`/games/${sessionId}/payments`);
  await page.locator("#total").fill("300");
  await page.locator("#details").fill("0917 123 4567 · Relay host");
  await page.getByRole("button", { name: "Create payment split" }).click();
  await page.locator('input[name="proof"]').setInputFiles("e2e/fixtures/payment-proof.png");
  await page.getByRole("button", { name: "Submit proof" }).click();
  await expect(page.getByText("Waiting for host review")).toBeVisible({ timeout: 15_000 });
  await page.getByText("Request new proof", { exact: true }).click();
  await page.getByLabel("Reason for requesting new proof").fill("Show the amount and recipient.");
  await page.getByRole("button", { name: "Send request" }).click();
  await expect(page.getByRole("paragraph").getByText("New proof requested", { exact: true })).toBeVisible();
  await page.locator('input[name="proof"]').setInputFiles("e2e/fixtures/payment-proof.png");
  await page.getByRole("button", { name: "Submit proof" }).click();
  await page.getByRole("button", { name: "Confirm paid" }).click();
  await expect(page.getByText("Paid", { exact: true })).toBeVisible();
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
  expect(await button.evaluate((element) => getComputedStyle(element).cursor)).toBe("pointer");
  const brand = page.getByRole("link", { name: "Relay home" });
  expect((await brand.boundingBox())?.height).toBeGreaterThanOrEqual(44);
});

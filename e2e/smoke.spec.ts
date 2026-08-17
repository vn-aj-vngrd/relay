import { expect, test } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

test("the landing page introduces Relay and protected routes open a usable login", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "One session. The whole pickleball night." })).toBeVisible();
  await expect(page.getByRole("link", { name: "Get started", exact: true }).first()).toHaveAttribute("href", "/signup");

  await page.goto("/home");
  expect(new URL(page.url()).pathname).toBe("/login");
  expect(new URL(page.url()).searchParams.get("next")).toBe("/home");
  await expect(page.getByRole("heading", { name: "Welcome back" })).toBeVisible();
  await expect(page.locator("#password-email")).toBeVisible();
  await expect(page.locator("#password")).toBeVisible();
  await expect(page.locator("form").getByRole("button", { name: "Sign in" })).toBeVisible();
  await expect(page.locator('[aria-label="Authentication method"]').getByRole("button", { name: "Create account" })).toBeVisible();
  await expect(page.getByText("Everything around game night")).toBeVisible();
  await expect(page.getByText("Run the courts")).toBeVisible();
  await expect(page.getByRole("button", { name: "Use dark mode" })).toBeVisible();
  await expect(page.getByText("Continue with Google")).toHaveCount(0);
  await page.getByRole("link", { name: "Relay home" }).click();
  await expect(page).toHaveURL(/\/$/);
  await expect(page.getByRole("heading", { name: "One session. The whole pickleball night." })).toBeVisible();
});

test("an authenticated host and guest can complete the core session flow", async ({ page, browser }, testInfo) => {
  test.setTimeout(120_000);
  test.skip(testInfo.project.name.startsWith("mobile"), "single-project auth mutation");
  test.skip(!process.env.E2E_AUTH_EMAIL || !process.env.E2E_AUTH_PASSWORD, "requires disposable auth credentials");

  await page.goto("/login");
  if (process.env.E2E_AUTH_EXISTING !== "true") {
    await page.locator('[aria-label="Authentication method"]').getByRole("button", { name: "Create account" }).click();
  }
  await page.locator("#password-email").fill(process.env.E2E_AUTH_EMAIL!);
  await page.locator("#password").fill(process.env.E2E_AUTH_PASSWORD!);
  await page.locator("form").getByRole("button", { name: process.env.E2E_AUTH_EXISTING === "true" ? "Sign in" : "Create account" }).click();

  await expect(page).toHaveURL(/\/onboarding$/, { timeout: 15_000 });
  await expect(page.getByRole("heading", { name: "Your player profile" })).toBeVisible();
  await page.getByRole("button", { name: "Skip setup and use my defaults" }).click();
  await expect(page).toHaveURL(/\/home\?tour=1$/);
  await expect(page.getByRole("dialog", { name: "Welcome to Relay" })).toBeVisible();
  await page.getByRole("button", { name: "Skip application tour" }).click();
  await expect(page).toHaveURL(/\/home$/);
  await expect(page.getByRole("heading", { name: /next game/i })).toBeVisible();

  await page.locator('button[aria-haspopup="menu"]:not([data-next-mark])').click();
  await page.getByRole("menuitem", { name: "Preferences" }).click();
  await page.getByRole("button", { name: "Use dark mode" }).click();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  await page.getByRole("button", { name: "Use light mode" }).click();
  await page.getByRole("button", { name: "Compact" }).click();
  await expect(page.locator("html")).toHaveAttribute("data-density", "compact");
  await page.getByRole("button", { name: "Default" }).click();
  await page.getByRole("button", { name: "Monday" }).click();
  await expect.poll(() => page.evaluate(() => localStorage.getItem("relay-week-start"))).toBe("monday");
  await page.locator('button[aria-haspopup="menu"]:not([data-next-mark])').click();
  await page.getByRole("menuitem", { name: "Sign out" }).click();
  await expect(page).toHaveURL(/\/login$/);

  await page.locator("#password-email").fill(process.env.E2E_AUTH_EMAIL!);
  await page.locator("#password").fill(process.env.E2E_AUTH_PASSWORD!);
  await page.locator("form").getByRole("button", { name: "Sign in" }).click();
  await expect(page).toHaveURL(/\/home$/, { timeout: 15_000 });
  await expect(page.getByRole("heading", { name: /next game/i })).toBeVisible();
  await page.goto("/");
  await expect(page.getByRole("link", { name: "Open app", exact: true }).first()).toHaveAttribute("href", "/home");
  await expect(page.getByRole("link", { name: "Log in", exact: true })).toHaveCount(0);
  await page.goto("/home");
  const desktopCreate = await page.getByRole("link", { name: "Create", exact: true }).first().boundingBox();
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
  await page.goto("/home");
  const mobileNav = await page.getByRole("navigation", { name: "Main navigation" }).boundingBox();
  expect(mobileNav).not.toBeNull();
  expect(mobileNav!.x).toBeGreaterThanOrEqual(0);
  expect(mobileNav!.x + mobileNav!.width).toBeLessThanOrEqual(320);

  await page.goto("/games/new");
  await expect(page.getByRole("navigation", { name: "Main navigation" })).toHaveCount(0);
  await page.getByRole("button", { name: "Publish game" }).click();
  await expect(page.getByText("A few details need attention. Check the fields marked below.", { exact: true })).toBeVisible();
  await expect(page.getByText("Choose a valid date and start time.", { exact: true }).first()).toBeVisible();
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

  await page.locator("#title").fill("Saturday Night Pickle");
  const gameDate = new Date();
  gameDate.setDate(gameDate.getDate() + 7);
  const gameDateLabel = new Intl.DateTimeFormat("en-PH", { weekday: "long", month: "long", day: "numeric", year: "numeric" }).format(gameDate);
  await page.getByRole("button", { name: "Date" }).click();
  await page.getByRole("button", { name: gameDateLabel }).click();
  await page.getByRole("button", { name: "Start time" }).click();
  await page.getByRole("option", { name: "7:00 PM" }).click();
  await page.getByRole("button", { name: "End time" }).click();
  await page.getByRole("option", { name: "9:00 PM" }).click();
  await page.locator("#capacity").fill("8");
  await page.locator("#venue").fill("Central Pickle");
  await expect(page.getByRole("listbox", { name: "Venue suggestions" })).toBeVisible({ timeout: 10_000 });
  await page.getByRole("option").first().click();
  await expect(page.locator('input[name="venueAddress"]')).not.toHaveValue("");
  const selectedVenue = await page.locator("#venue").inputValue();
  await page.locator("#courts").fill("21");
  await page.getByRole("button", { name: "Publish game" }).click();
  await expect(page.getByText("Relay supports up to 20 courts per session.")).toBeVisible();
  await expect(page.locator("#courts")).toBeFocused();
  await expect(page.locator("#venue")).toHaveValue(selectedVenue);

  await page.locator("#courts").fill("2");
  await page.getByRole("button", { name: "Publish game" }).click();
  await expect(page).toHaveURL(/\/games\/[0-9a-f-]+$/, { timeout: 15_000 });
  const sessionId = new URL(page.url()).pathname.split("/").at(-1);
  await page.setViewportSize({ width: 1280, height: 720 });
  await expect(page.getByText("Host workspace", { exact: true })).toBeVisible();
  const hostAccessibility = await new AxeBuilder({ page }).analyze();
  expect(hostAccessibility.violations.filter((item) => ["serious", "critical"].includes(item.impact ?? ""))).toEqual([]);
  for (const path of ["", "/players", "/play", "/chat", "/payments"]) {
    await page.goto(`/games/${sessionId}${path}`);
    await expect(page.getByRole("button", { name: "Share game" })).toBeVisible();
  }
  await page.goto(`/games/${sessionId}/players`);
  for (const name of ["Mika Reyes", "AJ Santos", "John Cruz"]) {
    await page.getByPlaceholder("Add a friend by name").fill(name);
    await page.getByRole("button", { name: "Add", exact: true }).click();
    await expect(page.getByText(name, { exact: true })).toBeVisible();
    await expect(page.getByPlaceholder("Add a friend by name")).toHaveValue("");
  }

  await page.goto(`/games/${sessionId}/more`);
  const publicHref = await page.locator('a[href^="/s/"]').first().getAttribute("href");
  expect(publicHref).toMatch(/^\/s\/[a-z0-9-]+$/);
  const guestContext = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const guestPage = await guestContext.newPage();
  await guestPage.goto(publicHref!);
  await expect(guestPage.getByRole("heading", { name: "Saturday Night Pickle" })).toBeVisible();
  const guestAccessibility = await new AxeBuilder({ page: guestPage }).analyze();
  expect(guestAccessibility.violations.filter((item) => ["serious", "critical"].includes(item.impact ?? ""))).toEqual([]);
  for (const label of ["Overview", "Players", "Play", "Chat", "Payments"]) {
    await expect(guestPage.getByRole("navigation", { name: "Game navigation" }).getByRole("link", { name: label, exact: true })).toBeVisible();
  }
  expect(await guestPage.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)).toBe(0);
  await guestPage.locator('input[name="guestName"]:visible').fill("Guest Bea");
  await guestPage.locator("button:visible", { hasText: "Confirm I’m going" }).click();
  await expect(guestPage.getByRole("status")).toHaveText("Response saved.");
  await guestPage.reload();
  await expect(guestPage.locator("p:visible", { hasText: "Guest player" })).toBeVisible();
  await guestPage.getByRole("link", { name: "Players", exact: true }).click();
  await expect(guestPage).toHaveURL(`${publicHref}/players`);
  await expect(guestPage.getByText("Guest Bea", { exact: true })).toBeVisible();

  await page.goto(`/games/${sessionId}/chat`);
  await guestPage.getByRole("link", { name: "Chat", exact: true }).click();
  await expect(guestPage).toHaveURL(`${publicHref}/chat`);
  await guestPage.getByRole("textbox", { name: "Message", exact: true }).fill("Guest Bea is bringing pickleballs.");
  await guestPage.getByRole("button", { name: "Send message" }).click();
  await expect(guestPage.getByText("Guest Bea is bringing pickleballs.", { exact: true })).toBeVisible();
  await expect(page.getByText("Guest Bea is bringing pickleballs.", { exact: true })).toBeVisible({ timeout: 15_000 });

  await page.goto(`/games/${sessionId}/payments`);
  await page.locator("#total").fill("300");
  await page.locator("#details").fill("0917 123 4567 · Relay host");
  await page.locator('#expense-receipt').setInputFiles("e2e/fixtures/payment-proof.png");
  await page.getByRole("button", { name: "Create collection" }).click();
  await expect(page.getByText("Host · paid the full amount upfront")).toBeVisible({ timeout: 15_000 });
  await expect(page.getByText("0 of 4 paid")).toBeVisible();
  await expect(page.getByText("Mika Reyes", { exact: true })).toBeVisible();
  await expect(page.getByText("Guest Bea", { exact: true })).toBeVisible();
  await expect(page.getByLabel("Payment screenshot")).toHaveCount(0);

  await guestPage.goto(`${publicHref}/payments`);
  await expect(guestPage.getByRole("heading", { name: "Your payment" })).toBeVisible();
  await guestPage.getByLabel("Payment screenshot").setInputFiles("e2e/fixtures/payment-proof.png");
  await guestPage.getByRole("button", { name: "Submit proof" }).click();
  await expect(guestPage.getByText("Proof sent—waiting for host")).toBeVisible({ timeout: 15_000 });
  await page.reload();
  const guestPaymentRow = page.getByRole("listitem").filter({ hasText: "Guest Bea" });
  await expect(guestPaymentRow.getByText("Waiting for host review")).toBeVisible();
  await guestPaymentRow.getByRole("button", { name: "Confirm paid" }).click();
  await expect(page.getByText("1 of 4 paid")).toBeVisible();
  await guestPage.reload();
  await expect(guestPage.getByText("Payment confirmed")).toBeVisible();

  await page.goto(`/games/${sessionId}/play`);
  await expect(page.getByRole("heading", { name: "Choose how tonight runs" })).toBeVisible();
  const mixItUp = page.getByRole("radio", { name: /Mix It Up/ });
  await page.getByText("Mix It Up", { exact: true }).click();
  await expect(mixItUp).toBeChecked();
  await page.getByRole("button", { name: "Start Play" }).click();
  await page.getByRole("button", { name: "Start first round" }).click();
  await expect(page.getByText("Match in progress")).toBeVisible();
  await guestPage.goto(`${publicHref}/play`);
  await expect(guestPage.getByText("Match in progress")).toBeVisible();
  const guestScore = guestPage.locator("output").first();
  const scoreBefore = Number(await guestScore.textContent());
  await page.getByRole("button", { name: /^Add a point to/ }).first().click();
  await expect(guestScore).toHaveText(String(scoreBefore + 1), { timeout: 15_000 });
  await page.getByRole("button", { name: "Finish match" }).first().click();
  await expect(guestPage.getByText("No match is active")).toBeVisible({ timeout: 15_000 });
  await expect(guestPage.getByRole("heading", { name: "Session Standings" })).toBeVisible();
  await guestContext.close();

  await page.goto(`/games/${sessionId}/more`);
  await page.getByRole("button", { name: "Delete game" }).click();
  await page.getByLabel(/Type Saturday Night Pickle to confirm/).fill("Saturday Night Pickle");
  await page.getByRole("dialog").getByRole("button", { name: "Delete game" }).click();
  await expect(page).toHaveURL(/\/games$/);
});

test("login and account creation have distinct entry routes", async ({ page }) => {
  await page.goto("/login");
  await expect(page.getByRole("heading", { name: "Welcome back" })).toBeVisible();
  await page.goto("/signup");
  await expect(page.getByRole("heading", { name: "Join your next game" })).toBeVisible();
  await expect(page.locator("#password")).toHaveAttribute("autocomplete", "new-password");
});

test("light mode is default and dark mode persists", async ({ page }) => {
  await page.goto("/login");
  const favicon = page.locator('link[rel~="icon"][type="image/svg+xml"]');
  await expect(page.locator("html")).toHaveAttribute("data-theme", "light");
  await expect(favicon).toHaveAttribute("href", "/relay-ball.svg");
  await page.getByRole("button", { name: "Use dark mode" }).evaluate((button: HTMLButtonElement) => button.click());
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  await expect(favicon).toHaveAttribute("href", "/relay-ball.svg");
  await page.reload();
  await expect(page.getByRole("button", { name: "Use light mode" })).toBeVisible();
  await expect(favicon).toHaveAttribute("href", "/relay-ball.svg");
});

test("public entry pages have no serious accessibility violations", async ({ page }) => {
  for (const path of ["/", "/login", "/signup"]) {
    await page.goto(path);
    const results = await new AxeBuilder({ page }).analyze();
    expect(results.violations.filter((item) => ["serious", "critical"].includes(item.impact ?? ""))).toEqual([]);
  }
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
  const venueSearch = await page.request.get("/api/venues/search?q=Central");
  expect(venueSearch.status()).toBe(401);
  const globalSearch = await page.request.get("/api/search?q=v&type=all");
  expect(globalSearch.status()).toBe(401);
  await page.goto("/games/new");
  expect(new URL(page.url()).pathname).toBe("/login");
  await page.goto("/groups/new");
  expect(new URL(page.url()).pathname).toBe("/login");
  await page.goto("/admin");
  expect(new URL(page.url()).pathname).toBe("/login");
  expect(new URL(page.url()).searchParams.get("next")).toBe("/admin");
  await page.goto("/set-password");
  expect(new URL(page.url()).pathname).toBe("/login");
  expect(new URL(page.url()).searchParams.get("next")).toBe("/set-password");
  await page.goto("/s/session-that-does-not-exist");
  await expect(page.getByRole("heading", { name: "This game isn’t here." })).toBeVisible({
    timeout: 15_000,
  });
});

test("mobile layout has no horizontal overflow and keeps primary targets usable", async ({ page }, testInfo) => {
  test.skip(!testInfo.project.name.startsWith("mobile"), "mobile-only validation");
  await page.goto("/");
  expect(await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)).toBe(0);
  await page.goto("/login");
  expect(await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)).toBe(0);
  const button = page.locator("form").getByRole("button", { name: "Sign in" });
  const box = await button.boundingBox();
  expect(box?.height).toBeGreaterThanOrEqual(44);
  expect(await button.evaluate((element) => getComputedStyle(element).cursor)).toBe("pointer");
  const brand = page.getByRole("link", { name: "Relay home" });
  expect((await brand.boundingBox())?.height).toBeGreaterThanOrEqual(44);
});

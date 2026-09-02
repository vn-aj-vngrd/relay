import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

test("the landing page introduces Relay and protected routes open a usable login", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "Plan the game. Share the link. Play." })).toBeVisible();
  await expect(page.getByRole("link", { name: "Get started", exact: true }).first()).toHaveAttribute("href", "/signup");
  const landingCourtFinder = page.locator("#court-finder");
  await expect(landingCourtFinder.getByRole("button", { name: "Zoom in" })).toBeVisible();
  await expect(landingCourtFinder.getByRole("button", { name: "Load interactive map" })).toHaveCount(0);

  await page.goto("/home");
  expect(new URL(page.url()).pathname).toBe("/login");
  expect(new URL(page.url()).searchParams.get("next")).toBe("/home");
  await expect(page.getByRole("heading", { name: "Log in to Relay" })).toBeVisible();
  await expect(page.locator("#password-email")).toBeVisible();
  await expect(page.locator("#password")).toBeVisible();
  await expect(page.locator("form").getByRole("button", { name: "Sign in" })).toBeVisible();
  await expect(
    page.locator('[aria-label="Authentication method"]').getByRole("link", { name: "Create account" }),
  ).toBeVisible();
  await expect(page.getByText("What you can do")).toHaveCount(0);
  await expect(page.getByText("Have an invite?", { exact: false })).toHaveCount(0);
  await expect(page.getByRole("group", { name: "Color theme" })).toHaveCount(0);
  await expect(page.getByRole("button", { name: /Use (?:light|dark) mode/ })).toHaveCount(0);
  const headerBox = await page.locator("header").boundingBox();
  const brandBox = await page.getByRole("link", { name: "Relay home" }).boundingBox();
  expect(brandBox).not.toBeNull();
  expect(headerBox).not.toBeNull();
  expect(Math.abs(brandBox!.x + brandBox!.width / 2 - (headerBox!.x + headerBox!.width / 2))).toBeLessThan(1);
  await expect(page.getByText("Continue with Google")).toHaveCount(0);
  await expect(page.getByRole("link", { name: "Forgot password?" })).toHaveAttribute("href", "/forgot-password");
  await page.getByRole("link", { name: "Forgot password?" }).click();
  await expect(page).toHaveURL(/\/forgot-password$/);
  await expect(page.getByRole("heading", { name: "Reset your password" })).toBeVisible();
  await expect(page.getByLabel("Email")).toHaveAttribute("autocomplete", "email");
  await expect(page.getByRole("button", { name: "Send reset link" })).toBeVisible();
  await page.goto("/forgot-password?sent=1");
  await expect(page.getByText("Password reset requested")).toBeVisible();
  await expect(page.getByRole("heading", { name: "Check your inbox" })).toBeVisible();
  await expect(page.getByRole("textbox", { name: "Email" })).toHaveCount(0);
  await page.getByRole("link", { name: "Relay home" }).click();
  await expect(page).toHaveURL(/\/$/);
  await expect(page.getByRole("heading", { name: "Plan the game. Share the link. Play." })).toBeVisible();
});

test("the public court finder works without an account", async ({ page }) => {
  await page.goto("/courts");
  await expect(page.getByRole("heading", { name: /Find a (?:pickleball )?court/ })).toBeVisible();
  await expect(page.getByRole("link", { name: "Create a game" })).toHaveAttribute("href", "/signup");
  await expect(page.getByRole("textbox", { name: "Search courts" })).toBeVisible();

  await page.goto("/court");
  await expect(page).toHaveURL(/\/login/);
});

test("public Quick Play prepares players, rotates, and scores without an account", async ({ page }) => {
  await page.goto("/play");
  await expect(page.getByRole("heading", { name: "Set up Play" })).toBeVisible();
  for (const [index, name] of ["Van", "AJ", "Mika", "John"].entries()) {
    await page.getByRole("textbox", { name: `Player ${index + 1}` }).fill(name);
  }
  await page.getByRole("button", { name: "Start Play" }).click();
  await page.getByRole("button", { name: "Add a point to Van + AJ" }).click();
  await expect(page.getByLabel("Van + AJ score 1")).toHaveText("1");
  await page.getByRole("button", { name: "Open full-screen scoreboard" }).click();
  await expect(page.getByRole("dialog", { name: "Court 1 full-screen scoreboard" })).toBeVisible();
  await page.getByRole("button", { name: "Close full-screen scoreboard" }).click();
  await page.reload();
  await expect(page.getByLabel("Van + AJ score 1")).toHaveText("1");
  await page.getByRole("button", { name: "Finish match" }).click();
  await expect(page.getByRole("heading", { name: "Standings" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Start next match" })).toBeVisible();
});

test("an authenticated host and guest can complete the core session flow", async ({ page, browser }, testInfo) => {
  test.setTimeout(180_000);
  test.skip(testInfo.project.name.startsWith("mobile"), "single-project auth mutation");
  test.skip(!process.env.E2E_AUTH_EMAIL || !process.env.E2E_AUTH_PASSWORD, "requires disposable auth credentials");

  await page.goto("/login");
  if (process.env.E2E_AUTH_EXISTING !== "true") {
    await page.locator('[aria-label="Authentication method"]').getByRole("link", { name: "Create account" }).click();
  }
  await page.locator("#password-email").fill(process.env.E2E_AUTH_EMAIL!);
  await page.locator("#password").fill(process.env.E2E_AUTH_PASSWORD!);
  await page
    .locator("form")
    .getByRole("button", { name: process.env.E2E_AUTH_EXISTING === "true" ? "Sign in" : "Create account" })
    .click();

  await expect(page).toHaveURL(/\/onboarding$/, { timeout: 15_000 });
  await expect(page.getByRole("heading", { name: "Welcome to Relay" })).toBeVisible();
  await page.getByRole("button", { name: "Skip setup and use my defaults" }).click();
  await expect(page).toHaveURL(/\/home\?tour=1$/);
  await expect(page.getByRole("dialog", { name: "Welcome to Relay" })).toBeVisible();
  await page.getByRole("button", { name: "Skip application tour" }).click();
  await expect(page).toHaveURL(/\/home$/);
  await expect(page.getByRole("heading", { name: /next game/i })).toBeVisible();
  await page.goto("/feedback");
  await expect(page.getByRole("heading", { name: "Send feedback" })).toBeVisible();
  await expect(page.getByRole("radio", { name: /Bug report/ })).toBeChecked();
  await expect(page.getByRole("button", { name: "Send feedback" })).toBeVisible();
  await page.goto("/home");

  await page.locator('button[aria-haspopup="menu"]:not([data-next-mark])').click();
  await page.getByRole("menuitem", { name: "Preferences" }).click();
  await page.getByRole("button", { name: "Dark", exact: true }).click();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  await page.getByRole("button", { name: "Light", exact: true }).click();
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
  await expect(page.getByRole("link", { name: "Get started", exact: true }).first()).toHaveAttribute("href", "/signup");
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
  await page.getByRole("button", { name: "List view" }).click();

  await page.setViewportSize({ width: 320, height: 700 });
  await page.goto("/home");
  const mobileNav = await page.getByRole("navigation", { name: "Main navigation" }).boundingBox();
  expect(mobileNav).not.toBeNull();
  expect(mobileNav!.x).toBeGreaterThanOrEqual(0);
  expect(mobileNav!.x + mobileNav!.width).toBeLessThanOrEqual(320);

  await page.goto("/games/new");
  await expect(page.getByRole("navigation", { name: "Main navigation" })).toHaveCount(0);
  await expect(page.getByText("Step 1 of 4")).toBeVisible();
  await page.getByRole("button", { name: "Continue to players" }).click();
  await expect(page.getByText("Add a game name with at least 2 characters.", { exact: true })).toBeVisible();
  await expect(page.getByText("Choose a date.", { exact: true })).toBeVisible();
  const date = await page.locator("#date").boundingBox();
  const start = await page.locator("#start").boundingBox();
  const end = await page.locator("#end").boundingBox();
  for (const field of [date, start, end]) {
    expect(field).not.toBeNull();
    expect(field!.x + field!.width).toBeLessThanOrEqual(320);
  }
  expect(start!.y + start!.height).toBeLessThanOrEqual(end!.y);

  await page.locator("#title").fill("Saturday Night Pickle");
  const gameDate = new Date();
  gameDate.setDate(gameDate.getDate() + 7);
  const gameDateLabel = new Intl.DateTimeFormat("en-PH", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  }).format(gameDate);
  await page.getByRole("button", { name: "Date" }).click();
  const today = new Date();
  if (gameDate.getMonth() !== today.getMonth() || gameDate.getFullYear() !== today.getFullYear()) {
    await page.getByRole("button", { name: "Next month" }).click();
  }
  await page.getByRole("button", { name: gameDateLabel }).click();
  await page.getByRole("button", { name: "Start time" }).click();
  await page.getByRole("option", { name: "7:00 PM" }).click();
  await page.getByRole("button", { name: "End time" }).click();
  await page.getByRole("option", { name: "9:00 PM" }).click();
  await page.locator("#venue").fill("Court District");
  await expect(page.getByRole("listbox", { name: "Court suggestions" })).toBeVisible({ timeout: 10_000 });
  await page.getByRole("option").first().click();
  await expect(page.locator('input[name="venueAddress"]')).not.toHaveValue("");
  const selectedVenue = await page.locator("#venue").inputValue();
  await page.getByRole("button", { name: "Continue to players" }).click();
  await expect(page.getByText("Step 2 of 4")).toBeVisible();
  const capacity = await page.locator("#capacity").boundingBox();
  expect(capacity).not.toBeNull();
  expect(capacity!.x + capacity!.width).toBeLessThanOrEqual(320);
  await page.locator("#capacity").fill("8");
  await page.locator("#courts").fill("21");
  await page.getByRole("button", { name: "Continue to details" }).click();
  await expect(page.getByText("Choose a whole-number court quantity from 1 to 20.")).toBeVisible();
  await expect(page.locator("#courts")).toBeFocused();

  await page.locator("#courts").fill("2");
  await page.getByRole("button", { name: "Continue to details" }).click();
  await expect(page.getByText("Step 3 of 4")).toBeVisible();
  await page.getByRole("button", { name: "Review game" }).click();
  await expect(page.getByText("Step 4 of 4")).toBeVisible();
  await expect(page.getByText(selectedVenue)).toBeVisible();
  await page.getByRole("button", { name: "Publish game" }).click();
  await expect(page).toHaveURL(/\/games\/[0-9a-f-]+$/, { timeout: 15_000 });
  const sessionId = new URL(page.url()).pathname.split("/").at(-1);

  await page.goto("/home");
  await expect(page.locator(`a[href="/games/${sessionId}"]`).first()).toBeVisible();
  await page.goto("/games");
  await expect(page.locator(`a[href="/games/${sessionId}"]`).first()).toBeVisible();
  await page.goto(`/games/${sessionId}`);

  await page.setViewportSize({ width: 393, height: 659 });
  await expect(page.locator("header.app-mobile-header")).toBeHidden();
  await expect(page.getByRole("navigation", { name: "Main navigation" })).toHaveCount(0);
  await expect(page.getByRole("link", { name: "Back to games" })).toBeVisible();
  const gameNavigation = await page.getByRole("navigation", { name: "Game navigation" }).boundingBox();
  expect(gameNavigation).not.toBeNull();
  expect(gameNavigation!.x).toBe(0);
  expect(gameNavigation!.width).toBe(393);
  for (const action of [
    page.getByRole("link", { name: "Edit game" }),
    page.getByRole("button", { name: "Share game" }),
  ]) {
    const bounds = await action.boundingBox();
    expect(bounds?.width).toBeGreaterThanOrEqual(44);
    expect(bounds?.height).toBeGreaterThanOrEqual(44);
  }
  expect(await page.getByRole("navigation", { name: "Breadcrumb" }).count()).toBe(0);
  expect(await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)).toBe(0);

  await page.setViewportSize({ width: 852, height: 393 });
  await expect(page.locator("header.app-mobile-header")).toBeHidden();
  expect(await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)).toBe(0);

  await page.setViewportSize({ width: 1280, height: 720 });
  await expect(page.getByRole("heading", { name: "Overview" })).toBeVisible();
  const hostAccessibility = await new AxeBuilder({ page }).analyze();
  expect(hostAccessibility.violations.filter((item) => ["serious", "critical"].includes(item.impact ?? ""))).toEqual(
    [],
  );
  for (const path of ["", "/players", "/play", "/chat", "/payments"]) {
    await page.goto(`/games/${sessionId}${path}`);
    await expect(page.getByRole("link", { name: "Edit game" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Share game" })).toBeVisible();
  }
  await page.goto(`/games/${sessionId}/players`);
  for (const name of ["Mika Reyes", "AJ Santos"]) {
    await page.getByPlaceholder("Guest name or @username").fill(name);
    await page.getByRole("button", { name: "Add", exact: true }).click();
    await expect(page.getByText(name, { exact: true })).toBeVisible({ timeout: 20_000 });
    await expect(page.getByPlaceholder("Guest name or @username")).toHaveValue("", { timeout: 20_000 });
  }

  await page.goto(`/games/${sessionId}/more`);
  const publicHref = await page.locator('a[href^="/s/"]').first().getAttribute("href");
  expect(publicHref).toMatch(/^\/s\/[a-z0-9-]+$/);
  const guestContext = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const guestPage = await guestContext.newPage();
  await guestPage.goto(publicHref!);
  await expect(guestPage.getByRole("heading", { name: "Saturday Night Pickle" })).toBeVisible();
  const structuredEvent = await guestPage.locator('script[type="application/ld+json"]').textContent();
  expect(JSON.parse(structuredEvent ?? "{}")).toMatchObject({
    "@type": "SportsEvent",
    name: "Saturday Night Pickle",
    maximumAttendeeCapacity: 8,
  });
  const openGraphImage = await guestPage.locator('meta[property="og:image"]').getAttribute("content");
  expect(openGraphImage).toContain("opengraph-image");
  const previewResponse = await guestPage.request.get(openGraphImage!);
  expect(previewResponse.ok()).toBe(true);
  expect(previewResponse.headers()["content-type"]).toContain("image/png");
  const guestAccessibility = await new AxeBuilder({ page: guestPage }).analyze();
  expect(guestAccessibility.violations.filter((item) => ["serious", "critical"].includes(item.impact ?? ""))).toEqual(
    [],
  );
  for (const label of ["Overview", "Players", "Play", "Chat", "Payments"]) {
    await expect(
      guestPage.getByRole("navigation", { name: "Game navigation" }).getByRole("link", { name: label, exact: true }),
    ).toBeVisible();
  }
  expect(await guestPage.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)).toBe(0);
  await guestPage.locator('input[name="guestName"]:visible').fill("Guest Bea");
  await guestPage.locator("button:visible", { hasText: "Confirm I’m going" }).click();
  await expect(guestPage.getByRole("status")).toHaveText("Response saved.", { timeout: 15_000 });
  await guestPage.reload();
  await expect(guestPage.locator("p:visible", { hasText: "Guest player" })).toBeVisible();
  await guestPage.getByRole("link", { name: "Players", exact: true }).click();
  await expect(guestPage).toHaveURL(`${publicHref}/players`);
  await expect(guestPage.getByText("Guest Bea", { exact: true })).toBeVisible();

  await page.goto(`/games/${sessionId}/chat`);
  await guestPage.getByRole("link", { name: "Chat", exact: true }).click();
  await expect(guestPage).toHaveURL(`${publicHref}/chat`);
  await guestPage.addStyleTag({ content: "nextjs-portal { display: none !important; }" });
  await guestPage.getByRole("textbox", { name: "Message", exact: true }).fill("Guest Bea is bringing pickleballs.");
  await guestPage.getByRole("button", { name: "Send message" }).click();
  await expect(guestPage.getByText("Guest Bea is bringing pickleballs.", { exact: true })).toBeVisible();
  await expect(page.getByText("Guest Bea is bringing pickleballs.", { exact: true })).toBeVisible({ timeout: 15_000 });

  await page.goto(`/games/${sessionId}/payments`);
  await page.locator("#total").fill("300");
  await page.locator("#details").fill("0917 123 4567 · Relay host");
  await page.locator("#expense-receipt").setInputFiles("e2e/fixtures/payment-proof.png");
  await page.getByRole("button", { name: "Create collection" }).click();
  await expect(page.getByText("Host · paid the full amount upfront")).toBeVisible({ timeout: 15_000 });
  await expect(page.getByText("0 of 3 paid")).toBeVisible();
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
  await expect(page.getByText("1 of 3 paid")).toBeVisible({ timeout: 30_000 });
  await guestPage.reload();
  await expect(guestPage.getByText("Payment confirmed")).toBeVisible();

  await page.goto(`/games/${sessionId}/play`);
  await page.getByRole("link", { name: "Start Play" }).click();
  await expect(page.getByRole("heading", { name: "Choose how this game runs" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Who’s here" })).toBeVisible();
  await expect(page.getByText(/No arrivals marked yet.*everyone going enters the first rotation/)).toBeVisible();
  const notHere = page.getByRole("button", { name: /^Mark .* as here$/ });
  await expect(notHere).toHaveCount(4);
  for (let remaining = 3; remaining >= 0; remaining -= 1) {
    await notHere.first().click();
    await expect(notHere).toHaveCount(remaining, { timeout: 15_000 });
  }
  await expect(page.getByText("4 here · players marked Not here can join the queue when they arrive.")).toBeVisible();
  await page.getByRole("radio", { name: /^Keep pairs together/ }).click();
  await expect(page.getByRole("heading", { name: "Set the pairs" })).toBeVisible();
  const teamRoundRobin = page.getByRole("radio", { name: /Team Round Robin/ });
  await page.getByText("Team Round Robin", { exact: true }).click();
  await expect(teamRoundRobin).toBeChecked();
  await page.getByRole("button", { name: "Round timer" }).click();
  await page.getByRole("option", { name: "10 minutes" }).click();
  await page.getByRole("button", { name: "Start Play" }).click();
  await page.getByRole("button", { name: "Start first round" }).click();
  await expect(page.getByText("Match in progress").first()).toBeVisible();
  await expect(page.getByText("Round timer", { exact: true })).toBeVisible();
  await guestPage.goto(`${publicHref}/play`);
  await expect(guestPage.getByText("Match in progress").first()).toBeVisible();
  const guestScore = guestPage.locator("output").first();
  const scoreBefore = Number(await guestScore.textContent());
  await page
    .getByRole("button", { name: /^Add a point to/ })
    .first()
    .click();
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
  await expect(page.getByRole("heading", { name: "Log in to Relay" })).toBeVisible();
  const authForm = page.locator("form").filter({ has: page.locator("#password-email") });
  await expect(authForm).toHaveAttribute("novalidate", "");
  expect(await page.locator("#password-email").evaluate((input: HTMLInputElement) => input.checkValidity())).toBe(
    false,
  );
  const authTabs = page.getByRole("group", { name: "Authentication method" });
  const signInPosition = await authTabs.boundingBox();
  await authTabs.getByRole("link", { name: "Create account" }).click();
  const createPosition = await authTabs.boundingBox();
  expect(createPosition?.y).toBe(signInPosition?.y);
  const panelBox = await page.locator("main > div").boundingBox();
  const mainBox = await page.locator("main").boundingBox();
  expect(panelBox && mainBox).toBeTruthy();
  expect(Math.abs(panelBox!.y + panelBox!.height / 2 - (mainBox!.y + mainBox!.height / 2))).toBeLessThan(1);

  await page.goto("/signup");
  await expect(page.getByRole("heading", { name: "Create your account" })).toBeVisible();
  await expect(page.locator("form").filter({ has: page.locator("#password-confirmation") })).toHaveAttribute(
    "novalidate",
    "",
  );
  await expect(page.locator("#password")).toHaveAttribute("autocomplete", "new-password");
  await expect(page.getByText("What you can do")).toHaveCount(0);
  await expect(page.getByText("Have an invite?", { exact: false })).toHaveCount(0);

  await page.goto("/signup?sent=account");
  await expect(page.getByText("Confirmation email sent")).toBeVisible();
  await expect(page.getByRole("heading", { name: "Check your inbox" })).toBeVisible();
  await expect(page.getByRole("link", { name: /Return to sign in/ })).toHaveAttribute("href", "/login");
  await expect(page.getByRole("button", { name: "Create account" })).toHaveCount(0);
  await expect(page.getByRole("textbox", { name: "Email" })).toHaveCount(0);
});

test("light mode is default and a stored dark preference loads", async ({ page }) => {
  await page.goto("/login");
  const favicon = page.locator('link[rel~="icon"][type="image/svg+xml"]');
  await expect(page.locator("html")).toHaveAttribute("data-theme", "light");
  await expect(page.getByRole("group", { name: "Color theme" })).toHaveCount(0);
  await expect(favicon).toHaveAttribute("href", "/relay-ball.svg");
  await page.evaluate(() => localStorage.setItem("relay-theme", "dark"));
  await page.reload();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  await expect(page.getByRole("group", { name: "Color theme" })).toHaveCount(0);
  await expect(favicon).toHaveAttribute("href", "/relay-ball.svg");
});

test("public entry pages have no serious accessibility violations in light and dark modes", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  for (const path of ["/", "/play", "/courts", "/login", "/signup", "/privacy", "/terms"]) {
    await page.goto(path);
    for (const theme of ["light", "dark"] as const) {
      await page.evaluate((nextTheme) => {
        document.documentElement.dataset.theme = nextTheme;
        document.documentElement.style.colorScheme = nextTheme;
        window.dispatchEvent(new Event("relay-theme-change"));
      }, theme);
      await expect(page.locator("html")).toHaveAttribute("data-theme", theme);
      const results = await new AxeBuilder({ page }).analyze();
      expect(results.violations.filter((item) => ["serious", "critical"].includes(item.impact ?? ""))).toEqual([]);
    }
  }
});

test("keyboard users can skip directly to the main content", async ({ page }) => {
  await page.goto("/play");
  await page.keyboard.press("Tab");
  const skip = page.getByRole("link", { name: "Skip to content" });
  await expect(skip).toBeFocused();
  await skip.press("Enter");
  await expect(page).toHaveURL(/#main-content$/);
});

test("CSP does not block React runtime scripts", async ({ page }) => {
  const evalErrors: string[] = [];
  page.on("console", (message) => {
    if (message.type() === "error" && message.text().includes("eval() is not supported"))
      evalErrors.push(message.text());
  });

  await page.goto("/login");
  await expect(page.getByRole("heading", { name: "Log in to Relay" })).toBeVisible();
  expect(evalErrors).toEqual([]);
});

test("public release metadata, health, and enforced CSP are available", async ({ page }) => {
  const [robots, sitemap, security, health] = await Promise.all([
    page.request.get("/robots.txt"),
    page.request.get("/sitemap.xml"),
    page.request.get("/.well-known/security.txt"),
    page.request.get("/api/health"),
  ]);
  expect(robots.ok()).toBe(true);
  expect(await robots.text()).toContain("Sitemap:");
  expect(sitemap.ok()).toBe(true);
  expect(sitemap.headers()["content-type"]).toContain("application/xml");
  expect(security.ok()).toBe(true);
  expect(await security.text()).toContain("Contact:");
  expect(await health.json()).toMatchObject({ status: "ok" });

  const [login, protectedRoute] = await Promise.all([
    page.request.get("/login"),
    page.request.get("/home", { maxRedirects: 0 }),
  ]);
  expect(login.ok()).toBe(true);
  expect(login.headers()["content-security-policy"]).toBeTruthy();
  expect(protectedRoute.headers()["content-security-policy"]).toContain("strict-dynamic");
  expect(login.headers()["content-security-policy-report-only"]).toBeUndefined();
});

test("core public and protected routes fail safely", async ({ page }) => {
  const removedVenueAutocomplete = await page.request.get("/api/venues/search?q=Central");
  expect(removedVenueAutocomplete.status()).toBe(404);
  const globalSearch = await page.request.get("/api/search?q=v&type=all");
  expect(globalSearch.status()).toBe(401);
  await page.goto("/games/open");
  expect(new URL(page.url()).pathname).toBe("/login");
  await page.goto("/games/new");
  expect(new URL(page.url()).pathname).toBe("/login");
  await page.goto("/groups/new");
  expect(new URL(page.url()).pathname).toBe("/login");
  await page.goto("/feedback");
  expect(new URL(page.url()).pathname).toBe("/login");
  await page.goto("/admin/feedback");
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
  await page.goto("/play");
  expect(await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)).toBe(0);
  const button = page.getByRole("button", { name: "Start Play" });
  const box = await button.boundingBox();
  expect(box?.height).toBeGreaterThanOrEqual(44);
  expect(await button.evaluate((element) => getComputedStyle(element).cursor)).toBe("pointer");
  const brand = page.getByRole("link", { name: "Relay home" });
  expect((await brand.boundingBox())?.height).toBeGreaterThanOrEqual(44);
});

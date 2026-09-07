import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

import { establishTestSession } from "./helpers/auth";
import { withLifecycleCleanup } from "./helpers/cleanup";
import { reusableTestGame } from "./helpers/session";

test("the landing page introduces Relay and protected routes open a usable login", async ({
  page,
}) => {
  await page.goto("/");
  await expect(
    page.getByRole("heading", { name: "Plan the game. Share the link. Play." })
  ).toBeVisible();
  const header = page.locator("header").first();
  const originalViewport = page.viewportSize();
  for (const width of [320, 768, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    const login = header.getByRole("link", { name: "Log in", exact: true });
    const signup = header.getByRole("link", { name: "Sign up", exact: true });
    await expect(login).toBeVisible();
    await expect(login).toHaveAttribute("href", "/login");
    await expect(signup).toBeVisible();
    await expect(signup).toHaveAttribute("href", "/signup");
    const brandBounds = await header
      .getByRole("link", { name: "Relay home" })
      .boundingBox();
    const loginBounds = await login.boundingBox();
    const signupBounds = await signup.boundingBox();
    expect(loginBounds!.height).toBeGreaterThanOrEqual(44);
    expect(signupBounds!.height).toBeGreaterThanOrEqual(44);
    expect(brandBounds!.x + brandBounds!.width).toBeLessThanOrEqual(
      loginBounds!.x
    );
    expect(loginBounds!.x + loginBounds!.width).toBeLessThanOrEqual(
      signupBounds!.x
    );
    expect(signupBounds!.x + signupBounds!.width).toBeLessThanOrEqual(width);
    const sectionNav = header.getByRole("navigation", {
      name: "Marketing navigation",
    });
    if (await sectionNav.isVisible()) {
      const navBounds = await sectionNav.boundingBox();
      expect(brandBounds!.x + brandBounds!.width).toBeLessThanOrEqual(
        navBounds!.x
      );
      expect(navBounds!.x + navBounds!.width).toBeLessThanOrEqual(
        loginBounds!.x
      );
    }
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth)
    ).toBeLessThanOrEqual(width);
  }
  if (originalViewport) await page.setViewportSize(originalViewport);
  await expect(
    page.getByRole("link", { name: "Create game", exact: true }).first()
  ).toHaveAttribute("href", "/games/new");
  const landingCourtFinder = page.locator("#court-finder");
  await expect(
    landingCourtFinder.getByRole("button", { name: "Zoom in" })
  ).toBeVisible();
  await expect(
    landingCourtFinder.getByRole("button", { name: "Load interactive map" })
  ).toHaveCount(0);

  await page.goto("/home");
  expect(new URL(page.url()).pathname).toBe("/login");
  expect(new URL(page.url()).searchParams.get("next")).toBe("/home");
  await expect(
    page.getByRole("heading", { name: "Log in to Relay" })
  ).toBeVisible();
  await expect(page.locator("#password-email")).toBeVisible();
  await expect(page.locator("#password")).toBeVisible();
  await expect(
    page.locator("form").getByRole("button", { name: "Sign in" })
  ).toBeVisible();
  await expect(
    page
      .locator('[aria-label="Authentication method"]')
      .getByRole("link", { name: "Create account" })
  ).toBeVisible();
  await expect(page.getByText("What you can do")).toHaveCount(0);
  await expect(page.getByText("Have an invite?", { exact: false })).toHaveCount(
    0
  );
  await expect(page.getByRole("group", { name: "Color theme" })).toHaveCount(0);
  await expect(
    page.getByRole("button", { name: /Use (?:light|dark) mode/ })
  ).toHaveCount(0);
  const headerBox = await page.locator("header").boundingBox();
  const brandBox = await page
    .getByRole("link", { name: "Relay home" })
    .boundingBox();
  expect(brandBox).not.toBeNull();
  expect(headerBox).not.toBeNull();
  expect(
    Math.abs(
      brandBox!.x + brandBox!.width / 2 - (headerBox!.x + headerBox!.width / 2)
    )
  ).toBeLessThan(1);
  const googleButton = page.getByRole("button", {
    name: "Continue with Google Beta",
  });
  if (await googleButton.count()) await expect(googleButton).toBeVisible();
  await expect(
    page.getByRole("link", { name: "Forgot password?" })
  ).toHaveAttribute("href", "/forgot-password");
  await page.goto("/forgot-password");
  await expect(page).toHaveURL(/\/forgot-password$/);
  await expect(
    page.getByRole("heading", { name: "Reset your password" })
  ).toBeVisible();
  await expect(page.getByLabel("Email")).toHaveAttribute(
    "autocomplete",
    "email"
  );
  await expect(
    page.getByRole("button", { name: "Send reset link" })
  ).toBeVisible();
  await page.goto("/forgot-password?sent=1");
  await expect(page.getByText("Password reset requested")).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Check your inbox" })
  ).toBeVisible();
  await expect(page.getByRole("textbox", { name: "Email" })).toHaveCount(0);
  await page.getByRole("link", { name: "Relay home" }).click();
  await expect(page).toHaveURL(/\/$/);
  await expect(
    page.getByRole("heading", { name: "Plan the game. Share the link. Play." })
  ).toBeVisible();
});

test("the public court finder works without an account", async ({ page }) => {
  await page.goto("/courts");
  await expect(
    page.getByRole("heading", { name: /Find a (?:pickleball )?court/ })
  ).toBeVisible();
  await expect(page.getByRole("link", { name: "Create game" })).toHaveAttribute(
    "href",
    "/games/new"
  );
  await expect(
    page.getByRole("textbox", { name: "Search courts" })
  ).toBeVisible();
  await expect(page.locator(".court-finder-workspace")).toBeVisible();
  const outerOverflow = await page
    .locator(".app-scroll-surface")
    .evaluate((element) => element.scrollHeight - element.clientHeight);
  expect(outerOverflow).toBeLessThanOrEqual(1);
  const courtList = page.locator("[data-court-list-pane] ul");
  await expect(courtList).toHaveCSS("overflow-y", "auto");
  expect(
    await courtList.evaluate(
      (element) => element.scrollHeight > element.clientHeight
    )
  ).toBe(true);

  const removedCourtRoute = await page.request.get("/court", {
    maxRedirects: 0,
  });
  expect(removedCourtRoute.status()).toBe(404);
});

test("the court map leaves its loading state when raster tiles stall", async ({
  page,
}) => {
  await page.route("**/api/venues/tiles/**", () => {});

  await page.goto("/courts");
  const listViewToggle = page.getByRole("button", {
    name: "Change court view, currently List",
  });
  if (await listViewToggle.isVisible()) {
    await listViewToggle.click();
    await page.getByRole("menuitemradio", { name: "Map" }).click();
  }
  await expect(page.getByText("Loading interactive map…")).toHaveCount(0, {
    timeout: 5_000,
  });
  await expect(
    page.getByRole("region", { name: "Interactive map of pickleball courts" })
  ).toBeVisible();
});

test("public Quick Play prepares players, rotates, and scores without an account", async ({
  page,
}) => {
  await page.goto("/play");
  const quickPlay = page.getByRole("region", { name: "Quick Play" });
  await expect(
    quickPlay.getByRole("link", { name: "Create game" })
  ).toHaveAttribute("href", "/games/new");
  await expect(
    quickPlay.getByRole("heading", { name: "Who’s playing" })
  ).toBeVisible();
  await expect(page.locator("select")).toHaveCount(0);
  for (const [index, name] of ["Van", "AJ", "Mika", "John"].entries()) {
    await page.getByRole("textbox", { name: `Player ${index + 1}` }).fill(name);
  }
  await page.getByRole("button", { name: "Continue to game options" }).click();
  await page.getByRole("button", { name: "Queue rule" }).click();
  await page
    .getByRole("option", { name: "Four rotate — a fresh group every match" })
    .click();
  await expect(page.getByRole("button", { name: "Queue rule" })).toContainText(
    "Four rotate"
  );
  await page.getByRole("button", { name: "Review setup" }).click();
  await expect(
    page.getByRole("heading", { name: "Review Quick Play" })
  ).toBeVisible();
  await page.getByRole("button", { name: "Start Play" }).click();
  await page.getByRole("button", { name: "Add a point to Van + AJ" }).click();
  await expect(page.getByLabel("Van + AJ score 1")).toHaveText("1");
  await page
    .getByRole("button", { name: "Open full-screen scoreboard" })
    .click();
  await expect(
    page.getByRole("dialog", { name: "Court 1 full-screen scoreboard" })
  ).toBeVisible();
  const initialViewport = page.viewportSize();
  for (const viewport of [
    { width: 320, height: 568 },
    { width: 390, height: 844 },
    { width: 667, height: 375 },
    { width: 1440, height: 900 },
  ]) {
    await page.setViewportSize(viewport);
    const dialog = page.getByRole("dialog", {
      name: "Court 1 full-screen scoreboard",
    });
    const addPoint = dialog.getByRole("button", {
      name: "Add a point to Van + AJ",
    });
    await addPoint.scrollIntoViewIfNeeded();
    const bounds = await addPoint.boundingBox();
    expect(bounds?.height).toBeGreaterThanOrEqual(64);
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth)
    ).toBeLessThanOrEqual(viewport.width);
    const finish = dialog.getByRole("button", {
      name: "Finish match",
      exact: true,
    });
    await finish.scrollIntoViewIfNeeded();
    const finishBounds = await finish.boundingBox();
    expect(finishBounds!.y + finishBounds!.height).toBeLessThanOrEqual(
      viewport.height
    );
  }
  if (initialViewport) await page.setViewportSize(initialViewport);
  await page
    .getByRole("button", { name: "Close full-screen scoreboard" })
    .click();
  await page.reload();
  await expect(page.getByLabel("Van + AJ score 1")).toHaveText("1");
  await page.getByRole("button", { name: "Finish match" }).click();
  await page
    .getByRole("dialog", { name: "Finish Court 1 at 1–0?" })
    .getByRole("button", { name: "Finish match" })
    .click();
  await expect(page.getByRole("heading", { name: "Standings" })).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Start next match" })
  ).toBeVisible();
});

test("an authenticated host and guest can complete the core session flow", async ({
  page,
  browser,
}, testInfo) => {
  test.setTimeout(240_000);
  const check = expect.configure({ timeout: 15_000 });
  test.skip(
    testInfo.project.name.startsWith("mobile"),
    "single-project auth mutation"
  );
  test.skip(
    process.env.E2E_SESSION_FIXTURE !== "true",
    "requires explicit trusted test-session opt-in; password/CAPTCHA is a separate manual smoke"
  );
  const baseURL = testInfo.project.use.baseURL!;
  await establishTestSession(page.context(), baseURL);
  await page.goto("/home");
  await check(page).toHaveURL(/\/(home|onboarding)(?:\?tour=1)?$/);
  if (new URL(page.url()).pathname === "/onboarding") {
    await check(
      page.getByRole("heading", { name: "How should players know you?" })
    ).toBeVisible();
    await page
      .getByRole("button", { name: "Use my defaults and start the tour" })
      .click();
    await check(page).toHaveURL(/\/home\?tour=1$/);
  }
  if (new URL(page.url()).searchParams.has("tour")) {
    await check(
      page.getByRole("dialog", { name: "Welcome to Relay" })
    ).toBeVisible();
    await page.getByRole("button", { name: "Skip application tour" }).click();
  }
  await check(page).toHaveURL(/\/home$/);
  await check(
    page.getByRole("heading", { name: /next game|taking shape/i, level: 1 })
  ).toBeVisible();
  const reuse = process.env.E2E_REUSE_SESSION_ID
    ? await reusableTestGame(baseURL, process.env.E2E_REUSE_SESSION_ID)
    : undefined;
  let sessionId = reuse?.id;
  const gameTitle = reuse?.title ?? `Relay E2E ${Date.now()}`;
  if (reuse)
    testInfo.annotations.push({
      type: "partial-diagnostic",
      description:
        "Resumed existing test game; this run does not validate creation/settings.",
    });
  await withLifecycleCleanup(
    async () => {
      if (!reuse) {
        await page.goto("/feedback");
        await check(
          page.getByRole("heading", { name: "Send feedback" })
        ).toBeVisible();
        await check(
          page.getByRole("radio", { name: /Bug report/ })
        ).toBeChecked();
        await check(
          page.getByRole("button", { name: "Send feedback" })
        ).toBeVisible();
        await page.goto("/home");

        await page.getByRole("button", { name: /^Open account menu/ }).click();
        await page.getByRole("menuitem", { name: "Settings" }).click();
        await page
          .getByRole("link", { name: "Appearance", exact: true })
          .click();
        await page.getByRole("button", { name: "Dark", exact: true }).click();
        await check(page.locator("html")).toHaveAttribute("data-theme", "dark");
        await page.getByRole("button", { name: "Light", exact: true }).click();
        await page.getByRole("button", { name: "Compact" }).click();
        await check(page.locator("html")).toHaveAttribute(
          "data-density",
          "compact"
        );
        await page.getByRole("button", { name: "Default" }).click();
        await page
          .getByRole("link", { name: "Games", exact: true })
          .last()
          .click();
        await page.getByRole("button", { name: "Monday" }).click();
        await check
          .poll(() =>
            page.evaluate(() => localStorage.getItem("relay-week-start"))
          )
          .toBe("monday");
        await page.getByRole("button", { name: /^Open account menu/ }).click();
        await page.getByRole("menuitem", { name: "Sign out" }).click();
        await check(page).toHaveURL(/\/login$/);

        await establishTestSession(page.context(), baseURL);
        await page.goto("/home");
        await check(page).toHaveURL(/\/home$/, { timeout: 15_000 });
        await check(
          page.getByRole("heading", {
            name: /next game|taking shape/i,
            level: 1,
          })
        ).toBeVisible();
        await page.goto("/");
        await check(
          page
            .locator("header")
            .getByRole("link", { name: "Open app", exact: true })
        ).toHaveAttribute("href", "/home");
        await check(
          page
            .locator("header")
            .getByRole("link", { name: "Sign up", exact: true })
        ).toHaveCount(0);
        await page.goto("/home");
        const desktopCreate = await page
          .getByRole("link", { name: "Create game", exact: true })
          .first()
          .boundingBox();
        check(desktopCreate).not.toBeNull();
        check(desktopCreate!.x).toBeLessThan(240);

        await page.goto("/games");
        await page.getByRole("button", { name: "Grid view" }).click();
        await check(
          page.getByRole("button", { name: "Grid view" })
        ).toHaveAttribute("aria-pressed", "true");
        await page.reload();
        await check(
          page.getByRole("button", { name: "Grid view" })
        ).toHaveAttribute("aria-pressed", "true");
        await page.getByRole("button", { name: "Calendar view" }).click();
        await check(page.getByTestId("games-calendar")).toBeVisible();
        await page.reload();
        await check(
          page.getByRole("button", { name: "Calendar view" })
        ).toHaveAttribute("aria-pressed", "true");
        await page.getByRole("button", { name: "List view" }).click();

        await page.setViewportSize({ width: 320, height: 700 });
        await page.goto("/home");
        const mobileNav = await page
          .getByRole("navigation", { name: "Main navigation" })
          .boundingBox();
        check(mobileNav).not.toBeNull();
        check(mobileNav!.x).toBeGreaterThanOrEqual(0);
        check(mobileNav!.x + mobileNav!.width).toBeLessThanOrEqual(320);

        await page.goto("/games/new");
        await check(
          page.getByRole("navigation", { name: "Main navigation" })
        ).toHaveCount(0);
        await check(page.getByText("Step 1 of 4")).toBeVisible();
        await page.getByRole("button", { name: "Continue to players" }).click();
        await check(
          page.getByText("Add a game name with at least 2 characters.", {
            exact: true,
          })
        ).toBeVisible();
        await check(
          page.getByText("Choose a date.", { exact: true })
        ).toBeVisible();
        const date = await page.locator("#date").boundingBox();
        const start = await page.locator("#start").boundingBox();
        const end = await page.locator("#end").boundingBox();
        for (const field of [date, start, end]) {
          check(field).not.toBeNull();
          check(field!.x + field!.width).toBeLessThanOrEqual(320);
        }
        check(start!.y + start!.height).toBeLessThanOrEqual(end!.y);

        await page.locator("#title").fill(gameTitle);
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
        if (
          gameDate.getMonth() !== today.getMonth() ||
          gameDate.getFullYear() !== today.getFullYear()
        ) {
          await page.getByRole("button", { name: "Next month" }).click();
        }
        await page.getByRole("button", { name: gameDateLabel }).click();
        await page.getByRole("combobox", { name: "Start time" }).click();
        await page.getByRole("option", { name: "7:00 PM" }).click();
        await page.getByRole("combobox", { name: "End time" }).fill("21:00");
        await page.getByRole("combobox", { name: "End time" }).press("Tab");
        await check(
          page.getByRole("combobox", { name: "End time" })
        ).toHaveValue("9:00 PM");
        await page.locator("#venue").fill("Court District");
        await check(
          page.getByRole("listbox", { name: "Court suggestions" })
        ).toBeVisible({ timeout: 10_000 });
        await page.getByRole("option").first().click();
        await check(page.locator('input[name="venueAddress"]')).not.toHaveValue(
          ""
        );
        const selectedVenue = await page.locator("#venue").inputValue();
        await page.getByRole("button", { name: "Continue to players" }).click();
        await check(page.getByText("Step 2 of 4")).toBeVisible();
        const capacity = await page.locator("#capacity").boundingBox();
        check(capacity).not.toBeNull();
        check(capacity!.x + capacity!.width).toBeLessThanOrEqual(320);
        await page.getByRole("radio", { name: /Anyone with the link/ }).check();
        await page.locator("#capacity").fill("8");
        await page.locator("#courts").fill("21");
        await page.getByRole("button", { name: "Continue to details" }).click();
        await check(
          page.getByText("Choose a whole-number court quantity from 1 to 20.")
        ).toBeVisible();
        await check(page.locator("#courts")).toBeFocused();

        await page.locator("#courts").fill("2");
        await page.getByRole("button", { name: "Continue to details" }).click();
        await check(page.getByText("Step 3 of 4")).toBeVisible();
        await page.getByRole("button", { name: "Review game" }).click();
        await check(page.getByText("Step 4 of 4")).toBeVisible();
        await check(page.getByText(selectedVenue)).toBeVisible();
        await page.getByRole("button", { name: "Publish game" }).click();
        await check(page).toHaveURL(/\/games\/[0-9a-f-]+$/, {
          timeout: 15_000,
        });
        sessionId = new URL(page.url()).pathname.split("/").at(-1);
        await page
          .getByRole("button", { name: "Dismiss game created message" })
          .click();
      }
      if (!reuse) {
        await page.goto("/home");
        await check(
          page.locator(`a[href="/games/${sessionId}"]`).first()
        ).toBeVisible();
        await page.goto("/games");
        await check(
          page.locator(`a[href="/games/${sessionId}"]`).first()
        ).toBeVisible();
        await page.goto(`/games/${sessionId}`);

        await page.setViewportSize({ width: 393, height: 659 });
        await check(page.locator("header.app-mobile-header")).toBeHidden();
        await check(
          page.getByRole("navigation", { name: "Main navigation" })
        ).toHaveCount(0);
        await check(
          page.getByRole("link", { name: "Back to games" })
        ).toBeVisible();
        const gameNavigation = await page
          .getByRole("navigation", { name: "Game navigation" })
          .boundingBox();
        check(gameNavigation).not.toBeNull();
        check(gameNavigation!.x).toBeGreaterThanOrEqual(0);
        check(gameNavigation!.x + gameNavigation!.width).toBeLessThanOrEqual(
          393
        );
        // The development indicator overlaps the top-right mobile action; it is not app UI.
        await page.evaluate(() => {
          const portal = document.querySelector("nextjs-portal");
          const badge = portal?.shadowRoot?.querySelector<HTMLElement>(
            "[data-nextjs-dev-tools-button]"
          );
          if (badge) badge.style.display = "none";
        });
        await page
          .getByRole("button", { name: "Game actions", exact: true })
          .click();
        for (const action of [
          page.getByRole("link", { name: "Edit game" }),
          page.getByRole("button", { name: "Share game" }),
        ]) {
          const bounds = await action.boundingBox();
          check(bounds?.width).toBeGreaterThanOrEqual(24);
          check(bounds?.height).toBeGreaterThanOrEqual(36);
        }
        await page.keyboard.press("Escape");
        check(
          await page.getByRole("navigation", { name: "Breadcrumb" }).count()
        ).toBe(0);
        check(
          await page.evaluate(
            () => document.documentElement.scrollWidth - window.innerWidth
          )
        ).toBe(0);

        await page.setViewportSize({ width: 852, height: 393 });
        await check(page.locator("header.app-mobile-header")).toBeHidden();
        check(
          await page.evaluate(
            () => document.documentElement.scrollWidth - window.innerWidth
          )
        ).toBe(0);

        await page.setViewportSize({ width: 1280, height: 720 });
        await check(
          page.getByRole("heading", { name: "Overview" })
        ).toBeVisible();
        const hostAccessibility = await new AxeBuilder({ page }).analyze();
        check(
          hostAccessibility.violations.filter((item) =>
            ["serious", "critical"].includes(item.impact ?? "")
          )
        ).toEqual([]);
        for (const path of ["", "/players", "/play", "/chat", "/payments"]) {
          await page.goto(`/games/${sessionId}${path}`);
          await page
            .getByRole("button", { name: "More game actions", exact: true })
            .click();
          await check(
            page.getByRole("link", { name: "Edit game" })
          ).toBeVisible();
          await check(
            page.getByRole("button", { name: "Share game" })
          ).toBeVisible();
          await page.keyboard.press("Escape");
        }
      }
      await page.goto(`/games/${sessionId}/players`);
      await check(page).toHaveURL(
        new RegExp(`/games/${sessionId}/play\\?panel=players$`)
      );
      for (const name of ["Mika Reyes", "AJ Santos"]) {
        await page.getByPlaceholder("Guest name or @username").fill(name);
        await page.getByRole("button", { name: "Add", exact: true }).click();
        await check(page.getByText(name, { exact: true })).toBeVisible({
          timeout: 20_000,
        });
        await check(
          page.getByPlaceholder("Guest name or @username")
        ).toHaveValue("", { timeout: 20_000 });
      }

      await page.goto(`/games/${sessionId}/more`);
      const publicHref = await page
        .locator('a[href^="/s/"]')
        .first()
        .getAttribute("href");
      check(publicHref).toMatch(/^\/s\/[a-z0-9-]+$/);
      const guestContext = await browser.newContext({
        viewport: { width: 390, height: 844 },
      });
      const guestPage = await guestContext.newPage();
      await guestPage.goto(publicHref!);
      await check(
        guestPage.getByRole("heading", { name: gameTitle })
      ).toBeVisible();
      const structuredEvent = await guestPage
        .locator('#main-content > script[type="application/ld+json"]')
        .textContent();
      check(JSON.parse(structuredEvent ?? "{}")).toMatchObject({
        "@type": "SportsEvent",
        name: gameTitle,
        maximumAttendeeCapacity: 8,
      });
      const openGraphImage = await guestPage
        .locator('meta[property="og:image"]')
        .getAttribute("content");
      check(openGraphImage).toContain("opengraph-image");
      const previewResponse = await guestPage.request.get(openGraphImage!);
      check(previewResponse.ok()).toBe(true);
      check(previewResponse.headers()["content-type"]).toContain("image/png");
      const guestAccessibility = await new AxeBuilder({
        page: guestPage,
      }).analyze();
      check(
        guestAccessibility.violations.filter((item) =>
          ["serious", "critical"].includes(item.impact ?? "")
        )
      ).toEqual([]);
      for (const label of ["Overview", "Play", "Chat", "Payments", "Story"]) {
        await check(
          guestPage
            .getByRole("navigation", { name: "Game navigation" })
            .getByRole("link", { name: label, exact: true })
        ).toBeVisible();
      }
      check(
        await guestPage.evaluate(
          () => document.documentElement.scrollWidth - window.innerWidth
        )
      ).toBe(0);
      await guestPage
        .locator('input[name="guestName"]:visible')
        .fill("Guest Bea");
      await guestPage
        .locator("button:visible", { hasText: "Confirm I’m going" })
        .click();
      await check(
        guestPage.getByRole("region", { name: "Your spot is saved." })
      ).toBeVisible({ timeout: 15_000 });
      await check(
        guestPage.getByRole("button", { name: "Going", exact: true })
      ).toHaveAttribute("aria-pressed", "true");
      await guestPage.reload();
      await check(
        guestPage.locator("p:visible", { hasText: "Guest player" })
      ).toBeVisible();
      await guestPage.getByRole("link", { name: "Play", exact: true }).click();
      await check(guestPage).toHaveURL(`${publicHref}/play`);
      await check(
        guestPage.getByText("Guest Bea", { exact: true })
      ).toBeVisible();

      await page.goto(`/games/${sessionId}/chat`);
      await guestPage.getByRole("link", { name: "Chat", exact: true }).click();
      await check(guestPage).toHaveURL(`${publicHref}/chat`);
      await guestPage.addStyleTag({
        content: "nextjs-portal { display: none !important; }",
      });
      await guestPage
        .getByRole("textbox", { name: "Message", exact: true })
        .fill("Guest Bea is bringing pickleballs.");
      await guestPage.getByRole("button", { name: "Send message" }).click();
      await check(
        guestPage.getByText("Guest Bea is bringing pickleballs.", {
          exact: true,
        })
      ).toBeVisible();
      await check(
        page.getByText("Guest Bea is bringing pickleballs.", { exact: true })
      ).toBeVisible({ timeout: 15_000 });

      await page.goto(`/games/${sessionId}/payments`);
      await page.locator("#total").fill("300");
      await page.locator("#details").fill("0917 123 4567 · Relay host");
      await page
        .locator("#expense-receipt")
        .setInputFiles("e2e/fixtures/payment-proof.png");
      await page.getByRole("button", { name: "Create collection" }).click();
      await check(
        page.getByText("Host · paid the full amount upfront")
      ).toBeVisible({ timeout: 15_000 });
      await check(page.getByText("0 of 3 paid")).toBeVisible();
      await check(page.getByText("Mika Reyes", { exact: true })).toBeVisible();
      await check(page.getByText("Guest Bea", { exact: true })).toBeVisible();
      await check(page.getByLabel("Payment screenshot")).toHaveCount(0);

      await guestPage.goto(`${publicHref}/payments`);
      await check(
        guestPage.getByRole("heading", { name: "Your payment" })
      ).toBeVisible();
      await guestPage
        .getByLabel("Payment screenshot")
        .setInputFiles("e2e/fixtures/payment-proof.png");
      await guestPage.getByRole("button", { name: "Submit proof" }).click();
      await check(
        guestPage.getByText("Proof sent—waiting for host")
      ).toBeVisible({
        timeout: 15_000,
      });
      await page.reload();
      const guestPaymentRow = page
        .getByRole("listitem")
        .filter({ hasText: "Guest Bea" });
      await check(
        guestPaymentRow.getByText("Waiting for host review")
      ).toBeVisible();
      await guestPaymentRow
        .getByRole("button", { name: "Confirm paid" })
        .click();
      await check(page.getByText("1 of 3 paid")).toBeVisible({
        timeout: 30_000,
      });
      await guestPage.reload();
      await check(guestPage.getByText("Payment confirmed")).toBeVisible();

      await page.goto(`/games/${sessionId}/play`);
      await page.getByRole("link", { name: "Set up Play" }).click();
      await check(
        page.getByRole("dialog", { name: "Is the court ready?" })
      ).toBeVisible();
      await page
        .getByRole("button", { name: "No booking needed", exact: true })
        .click();
      await check(
        page.getByRole("heading", { name: "Confirm who’s playing" })
      ).toBeVisible();
      await check(
        page.getByRole("heading", { name: "Who’s here" })
      ).toBeVisible();
      await check(
        page.getByText(
          /No arrivals marked yet.*Everyone going will enter the first rotation/
        )
      ).toBeVisible();
      const notHere = page.getByRole("button", { name: /^Mark .* as here$/ });
      await check(notHere).toHaveCount(4);
      for (let remaining = 3; remaining >= 0; remaining -= 1) {
        await notHere.first().click();
        await check(notHere).toHaveCount(remaining, { timeout: 15_000 });
      }
      await check(
        page.getByText(
          "4 here · players marked Not here can join the queue when they arrive."
        )
      ).toBeVisible();
      await page
        .getByRole("button", { name: "Continue to game options" })
        .click();
      await check(
        page.getByRole("heading", { name: "Choose how this game runs" })
      ).toBeVisible();
      await page.getByRole("radio", { name: /^Keep pairs together/ }).click();
      await check(
        page.getByRole("heading", { name: "Set the pairs" })
      ).toBeVisible();
      const teamRoundRobin = page.getByRole("radio", {
        name: /Team Round Robin/,
      });
      await page.getByText("Team Round Robin", { exact: true }).click();
      await check(teamRoundRobin).toBeChecked();
      await page.getByRole("button", { name: "Round timer" }).click();
      await page.getByRole("option", { name: "10 minutes" }).click();
      await page
        .getByRole("button", { name: "Review setup", exact: true })
        .click();
      await check(
        page.getByRole("heading", { name: "Review Play setup" })
      ).toBeVisible();
      await page.getByRole("button", { name: "Start Play" }).click();
      await check(page.getByText("Match in progress").first()).toBeVisible();
      await check(page.getByText("Round timer", { exact: true })).toBeVisible();
      const playersTrigger = page.getByRole("button", {
        name: "Players (4)",
        exact: true,
      });
      await playersTrigger.click();
      const rosterDrawer = page.getByRole("dialog", {
        name: "Players (4)",
        exact: true,
      });
      const removePlayer = rosterDrawer.getByRole("button", {
        name: "Remove Mika Reyes",
        exact: true,
      });
      await removePlayer.click();
      const removal = page.getByRole("dialog", {
        name: "Remove Mika Reyes?",
        exact: true,
      });
      await check(removal).toBeVisible();
      await page.keyboard.press("Escape");
      await check(removal).not.toBeVisible();
      await check(rosterDrawer).toBeVisible();
      await check(page).toHaveURL(
        new RegExp(`/games/${sessionId}/play\\?panel=players$`)
      );
      await check(removePlayer).toBeFocused();
      await page.keyboard.press("Escape");
      await check(rosterDrawer).not.toBeVisible();
      await check(playersTrigger).toBeFocused();
      await check(page).toHaveURL(new RegExp(`/games/${sessionId}/play$`));
      await guestPage.goto(`${publicHref}/play`);
      await check(
        guestPage.getByText("Match in progress").first()
      ).toBeVisible();
      const guestScore = guestPage.locator("output").first();
      const scoreBefore = Number(await guestScore.textContent());
      await page
        .getByRole("button", { name: /^Add a point to/ })
        .first()
        .click();
      await check(guestScore).toHaveText(String(scoreBefore + 1), {
        timeout: 15_000,
      });
      await page.getByRole("button", { name: "Finish match" }).first().click();
      await page
        .getByRole("dialog", { name: /^Finish / })
        .getByRole("button", { name: "Finish match", exact: true })
        .click();
      await check(
        guestPage.getByRole("heading", { name: "Round robin complete" })
      ).toBeVisible({ timeout: 15_000 });
      await guestPage
        .getByRole("button", { name: "Standings", exact: true })
        .click();
      await check(
        guestPage.getByRole("heading", { name: "Session Standings" })
      ).toBeVisible();
      await page.getByRole("button", { name: "Manage", exact: true }).click();
      await page
        .getByRole("button", { name: "End session", exact: true })
        .click();
      await page
        .getByRole("dialog", { name: "End this session?" })
        .getByRole("button", { name: "End session", exact: true })
        .click();
      await check(
        page.getByRole("heading", { name: "Recap", exact: true })
      ).toBeVisible({ timeout: 15000 });
      await check(
        guestPage.getByRole("heading", { name: "Recap", exact: true })
      ).toBeVisible({ timeout: 15000 });
      await page.goto(`/games/${sessionId}/players`);
      await check(
        page.getByRole("heading", { name: "Final roster" })
      ).toBeVisible();
      await check(page.getByPlaceholder("Guest name or @username")).toHaveCount(
        0
      );
      await guestContext.close();
    },
    async () => {
      if (!sessionId) return;
      if (process.env.E2E_RETAIN_SESSION === "true") {
        testInfo.annotations.push({
          type: "retained-test-game",
          description: `Cleanup deferred for explicitly retained test game ${sessionId}.`,
        });
        return;
      }
      await page.goto(`/games/${sessionId}/more`);
      await page.getByRole("button", { name: "Delete game" }).click();
      await page.getByLabel(`Type ${gameTitle} to confirm`).fill(gameTitle);
      await page
        .getByRole("dialog")
        .getByRole("button", { name: "Delete game" })
        .click();
      await check(page).toHaveURL(/\/games$/);
    },
    () => {
      testInfo.annotations.push({
        type: "cleanup-failure",
        description: `Could not remove test game ${sessionId}; inspect the server log before retrying.`,
      });
    }
  );
});

test("login and account creation have distinct entry routes", async ({
  page,
}) => {
  await page.goto("/login");
  await expect(
    page.getByRole("heading", { name: "Log in to Relay" })
  ).toBeVisible();
  const authForm = page
    .locator("form")
    .filter({ has: page.locator("#password-email") });
  await expect(authForm).toHaveAttribute("novalidate", "");
  expect(
    await page
      .locator("#password-email")
      .evaluate((input: HTMLInputElement) => input.checkValidity())
  ).toBe(false);
  const authTabs = page.getByRole("group", { name: "Authentication method" });
  await expect(authTabs).toBeVisible();
  const signInPosition = await authTabs.boundingBox();
  expect(signInPosition).not.toBeNull();
  await authTabs.getByRole("link", { name: "Create account" }).click();
  await expect(page).toHaveURL(/\/signup$/);
  await expect(authTabs).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Create your account" })
  ).toBeVisible();
  await expect(page.locator("main > div")).toBeVisible();
  await expect(async () => {
    const createPosition = await authTabs.boundingBox();
    expect(createPosition).not.toBeNull();
    expect(createPosition!.y).toBe(signInPosition!.y);
  }).toPass();
  const panelBox = await page.locator("main > div").boundingBox();
  const mainBox = await page.locator("main").boundingBox();
  expect(panelBox && mainBox).toBeTruthy();
  expect(
    Math.abs(
      panelBox!.y + panelBox!.height / 2 - (mainBox!.y + mainBox!.height / 2)
    )
  ).toBeLessThan(1);

  await page.goto("/signup");
  await expect(
    page.getByRole("heading", { name: "Create your account" })
  ).toBeVisible();
  await expect(
    page.locator("form").filter({ has: page.locator("#password-confirmation") })
  ).toHaveAttribute("novalidate", "");
  await expect(page.locator("#password")).toHaveAttribute(
    "autocomplete",
    "new-password"
  );
  await expect(page.getByText("What you can do")).toHaveCount(0);
  await expect(page.getByText("Have an invite?", { exact: false })).toHaveCount(
    0
  );

  await page.goto("/signup?sent=account");
  await expect(page.getByText("Confirmation email sent")).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Check your inbox" })
  ).toBeVisible();
  await expect(
    page.getByRole("link", { name: /Return to sign in/ })
  ).toHaveAttribute("href", "/login");
  await expect(
    page.getByRole("button", { name: "Create account" })
  ).toHaveCount(0);
  await expect(page.getByRole("textbox", { name: "Email" })).toHaveCount(0);
});

test("light mode is default and a stored dark preference loads", async ({
  page,
}) => {
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

for (const { path, ready } of [
  { path: "/", ready: "h1" },
  { path: "/play", ready: "#quick-players-title" },
  { path: "/courts", ready: ".court-finder-workspace input[placeholder]" },
  { path: "/games/open", ready: "h1" },
  { path: "/login", ready: "#password-email" },
  { path: "/signup", ready: "#password-confirmation" },
  { path: "/privacy", ready: "h1" },
  { path: "/terms", ready: "h1" },
]) {
  test(`public entry ${path} has no serious accessibility violations in light and dark modes`, async ({
    page,
  }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto(path, { waitUntil: "domcontentloaded" });
    for (const theme of ["light", "dark"] as const) {
      await page.evaluate(
        (nextTheme) => localStorage.setItem("relay-theme", nextTheme),
        theme
      );
      await page.reload({ waitUntil: "domcontentloaded" });
      await expect(page.locator(ready).first()).toBeVisible();
      await expect(page.locator("html")).toHaveAttribute("data-theme", theme);
      const results = await new AxeBuilder({ page }).analyze();
      expect(
        results.violations.filter((item) =>
          ["serious", "critical"].includes(item.impact ?? "")
        )
      ).toEqual([]);
    }
  });
}

test("keyboard users can skip directly to the main content", async ({
  page,
}) => {
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
    if (
      message.type() === "error" &&
      message.text().includes("eval() is not supported")
    )
      evalErrors.push(message.text());
  });

  await page.goto("/login");
  await expect(
    page.getByRole("heading", { name: "Log in to Relay" })
  ).toBeVisible();
  expect(evalErrors).toEqual([]);
});

test("public release metadata, health, and enforced CSP are available", async ({
  page,
}) => {
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
  expect(protectedRoute.headers()["content-security-policy"]).toContain(
    "strict-dynamic"
  );
  expect(
    login.headers()["content-security-policy-report-only"]
  ).toBeUndefined();
});

test("core public and protected routes fail safely", async ({ page }) => {
  const removedVenueAutocomplete = await page.request.get(
    "/api/venues/search?q=Central"
  );
  expect(removedVenueAutocomplete.status()).toBe(404);
  const globalSearch = await page.request.get("/api/search?q=v&type=all");
  expect(globalSearch.status()).toBe(401);
  await page.goto("/games/open");
  await expect(
    page.getByRole("heading", { name: "Open games", exact: true })
  ).toBeVisible();
  await page.goto("/games/new");
  await expect(page.getByRole("heading", { name: "The plan" })).toBeVisible();
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
  await expect(
    page.getByRole("heading", { name: "This game isn’t here." })
  ).toBeVisible({
    timeout: 15_000,
  });
});

test("mobile layout has no horizontal overflow and keeps primary targets usable", async ({
  page,
}, testInfo) => {
  test.skip(
    !testInfo.project.name.startsWith("mobile"),
    "mobile-only validation"
  );
  await page.goto("/");
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth - window.innerWidth
    )
  ).toBe(0);
  await page.goto("/play");
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth - window.innerWidth
    )
  ).toBe(0);
  const button = page.getByRole("button", {
    name: "Continue to game options",
  });
  const box = await button.boundingBox();
  expect(box?.height).toBeGreaterThanOrEqual(44);
  expect(
    await button.evaluate((element) => getComputedStyle(element).cursor)
  ).toBe("pointer");
  const brand = page.getByRole("link", { name: "Relay home" });
  expect((await brand.boundingBox())?.height).toBeGreaterThanOrEqual(44);
});

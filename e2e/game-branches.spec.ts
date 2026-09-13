import { expect, test } from "@playwright/test";

import { establishTestSession } from "./helpers/auth";
import { reusableTestGame } from "./helpers/session";

test("owned retained game handles approval, waitlist, response changes, locking and cancellation", async ({
  page,
  browser,
}, testInfo) => {
  test.setTimeout(240_000);
  test.skip(
    testInfo.project.name !== "desktop-chromium",
    "single-project mutation"
  );
  const id = process.env.E2E_BRANCH_SESSION_ID;
  test.skip(
    process.env.E2E_SESSION_FIXTURE !== "true" || !id,
    "requires explicit dedicated account and retained game ID"
  );
  const baseURL = testInfo.project.use.baseURL!;
  const game = await reusableTestGame(baseURL, id!);
  await establishTestSession(page.context(), baseURL);
  const check = expect.configure({ timeout: 15_000 });
  const workspace = `/games/${game.id}`;
  testInfo.annotations.push({
    type: "retained-branch-diagnostic",
    description: `Mutates and retains exact owned game ${game.id}; excludes creation.`,
  });
  await page.goto(`${workspace}/more`);
  const shared = await page
    .locator('a[href^="/s/"]')
    .first()
    .getAttribute("href");
  check(shared).toMatch(/^\/s\/[a-z0-9-]+$/);
  await page.goto(`${workspace}/play`);
  const going = page.getByRole("region", { name: "Going", exact: true });
  await check(going).toBeVisible();
  const initialCount = await going.getByRole("listitem").count();
  check(initialCount).toBeGreaterThan(0);
  const guests = await Promise.all(
    Array.from({ length: 3 }, () =>
      browser.newContext({ baseURL, viewport: { width: 390, height: 844 } })
    )
  );
  const [first, second, rejected] = await Promise.all(
    guests.map((context) => context.newPage())
  );
  const names = [
    `Agent Branch A ${Date.now()}`,
    `Agent Branch B ${Date.now()}`,
    `Agent Branch C ${Date.now()}`,
  ];
  try {
    await test.step("Host edits capacity and requires approval", async () => {
      await page.goto(`${workspace}/settings`);
      await page
        .getByRole("spinbutton", { name: "Player limit", exact: true })
        .fill(String(initialCount + 1));
      await page
        .getByRole("button", { name: "Save changes", exact: true })
        .click();
      await check(page).toHaveURL(new RegExp(`${workspace}$`));
      await page.goto(`${workspace}/settings`);
      // Use the canonical settings navigation so query conventions stay owned by the app.
      await page
        .getByRole("navigation", { name: "Game settings sections" })
        .getByRole("link", { name: "Invite", exact: true })
        .click();
      await page
        .getByRole("checkbox", {
          name: /^Approve new players before they join/,
        })
        .check();
      await page
        .getByRole("button", { name: "Save changes", exact: true })
        .click();
      await check(page).toHaveURL(new RegExp(`${workspace}$`));
    });
    await test.step("Guests request, host approves and rejects, pending names stay private", async () => {
      for (const [index, guest] of [first, second, rejected].entries()) {
        await guest.goto(shared!);
        await guest
          .getByRole("textbox", { name: "Your name", exact: true })
          .fill(names[index]);
        await guest
          .getByRole("button", { name: "Request to join", exact: true })
          .click();
        await check(
          guest.getByRole("heading", {
            name: "Your request is with the host.",
            exact: true,
          })
        ).toBeVisible();
      }
      await first.goto(`${shared}/play`);
      await check(
        first.getByRole("heading", { name: "Join requests", exact: true })
      ).toHaveCount(0);
      await check(first.getByText(names[1], { exact: true })).toHaveCount(0);
      await check(
        first.getByRole("button", { name: "Lock roster", exact: true })
      ).toHaveCount(0);
      await page.goto(`${workspace}/play`);
      const requests = page.getByRole("region", {
        name: "Join requests",
        exact: true,
      });
      await requests
        .getByRole("listitem")
        .filter({ hasText: names[0] })
        .getByRole("button", { name: "Approve", exact: true })
        .click();
      await check(going.getByText(names[0], { exact: true })).toBeVisible();
      await requests
        .getByRole("listitem")
        .filter({ hasText: names[1] })
        .getByRole("button", { name: "Approve", exact: true })
        .click();
      await check(
        page
          .getByRole("region", { name: "Waitlist", exact: true })
          .getByText(names[1], { exact: true })
      ).toBeVisible();
      await requests
        .getByRole("listitem")
        .filter({ hasText: names[2] })
        .getByRole("button", { name: "Reject", exact: true })
        .click();
      await check(requests).toHaveCount(0);
    });
    await test.step("Maybe frees a spot and promotes the earliest waitlisted guest", async () => {
      await first.goto(shared!);
      await first.getByRole("button", { name: "Maybe", exact: true }).click();
      await first
        .getByRole("button", { name: "Update response", exact: true })
        .click();
      await check(
        first.getByRole("heading", {
          name: "Maybe saved—no spot reserved.",
          exact: true,
        })
      ).toBeVisible();
      await page.reload();
      await check(going.getByText(names[1], { exact: true })).toBeVisible();
      await check(going.getByText(names[0], { exact: true })).toHaveCount(0);
      await first.reload();
      await check(
        first.getByRole("button", { name: "Maybe", exact: true })
      ).toHaveAttribute("aria-pressed", "true");
      await first
        .getByRole("button", { name: "Can’t go", exact: true })
        .click();
      await first
        .getByRole("button", { name: "Update response", exact: true })
        .click();
      await check(
        first.getByRole("heading", {
          name: "Your response is saved.",
          exact: true,
        })
      ).toBeVisible();
    });
    await test.step("Locking prevents responses and unlock restores them", async () => {
      await page
        .getByRole("button", { name: "Lock roster", exact: true })
        .click();
      await check(
        page.getByRole("button", { name: "Unlock roster", exact: true })
      ).toBeVisible();
      await second.goto(shared!);
      await check(
        second.locator("p:visible", { hasText: /^The roster is closed$/ })
      ).toBeVisible();
      await check(
        second.getByRole("button", { name: "Update response", exact: true })
      ).toHaveCount(0);
      await page
        .getByRole("button", { name: "Unlock roster", exact: true })
        .click();
      await check(
        page.getByRole("button", { name: "Lock roster", exact: true })
      ).toBeVisible();
      await second.reload();
      await check(
        second.getByRole("button", { name: "Update response", exact: true })
      ).toBeVisible();
    });
    if (process.env.E2E_BRANCH_CANCEL === "true") {
      await test.step("Cancellation closes participation and preserves its reason", async () => {
        await page.goto(`${workspace}/settings`);
        await page
          .getByRole("button", { name: "Cancel game", exact: true })
          .click();
        const dialog = page.getByRole("dialog", {
          name: "Cancel this game?",
          exact: true,
        });
        await dialog
          .getByRole("textbox", { name: /^Note for players/ })
          .fill("Agent validation: disposable game will not go ahead.");
        await dialog
          .getByRole("button", { name: "Cancel and notify", exact: true })
          .click();
        await check(dialog).toBeHidden();
        await second.goto(shared!);
        await check(
          second.getByText(
            "Agent validation: disposable game will not go ahead.",
            { exact: true }
          )
        ).toBeVisible();
        await check(
          second.getByRole("button", { name: "Update response", exact: true })
        ).toHaveCount(0);
        await page.goto(`${workspace}/play`);
        await check(
          page.getByRole("link", { name: "Set up Play", exact: true })
        ).toHaveCount(0);
        await check(
          page.getByRole("button", { name: "Lock roster", exact: true })
        ).toHaveCount(0);
      });
    }
  } finally {
    await Promise.all(guests.map((context) => context.close()));
  }
});

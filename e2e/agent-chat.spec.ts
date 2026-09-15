import { execFileSync } from "node:child_process";
import { mkdtemp, readFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { expect, test } from "@playwright/test";

let bundle: string;
test.beforeAll(async () => {
  const directory = await mkdtemp(join(tmpdir(), "relay-agent-"));
  const file = join(directory, "fixture.js");
  execFileSync("node_modules/.bin/esbuild", [
    "e2e/fixtures/agent-chat.tsx",
    "--bundle",
    `--outfile=${file}`,
    "--platform=browser",
    "--jsx=automatic",
    "--alias:@=./src",
    '--define:process.env.NODE_ENV="production"',
    "--define:process.env={}",
  ]);
  bundle = await readFile(file, "utf8");
});

for (const width of [390, 1440]) {
  test(`synthetic Agent conversation and recovery at ${width}px`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.goto("/");
    const styles = await page
      .locator('link[rel="stylesheet"], style')
      .evaluateAll((elements) =>
        elements.map((element) => element.outerHTML).join("")
      );
    await page.route("**/__synthetic-agent", (route) =>
      route.fulfill({
        contentType: "text/html",
        body: `<html><head><meta name="viewport" content="width=device-width, initial-scale=1">${styles}</head><body><div id="agent-fixture"></div></body></html>`,
      })
    );
    await page.route("**/api/agent", (route) =>
      route.fulfill(
        route.request().method() === "GET"
          ? {
              contentType: "application/json",
              body: JSON.stringify({
                plan: "free",
                limit: 50,
                used: 1,
                reserved: 0,
                remaining: 49,
                resetsAt: "2030-10-01T00:00:00Z",
              }),
            }
          : {
              contentType: "text/plain",
              body: "Synthetic answer: your game is tomorrow. [Guide](/help/create-game)",
            }
      )
    );
    await page.goto("/__synthetic-agent");
    await page.addScriptTag({ content: bundle });
    await page
      .getByRole("button", { name: "When is my next game?", exact: true })
      .click();
    await expect(page.getByRole("log")).toContainText("Synthetic answer");
    await expect(page.getByText(/1 of 50 messages used/)).toBeVisible();
    await expect(page.getByRole("link", { name: "Guide" })).toHaveAttribute(
      "href",
      "/help/create-game"
    );
    await expect(
      page.getByRole("button", { name: "Send message" })
    ).toBeDisabled();
    await page.getByRole("button", { name: "New chat" }).click();
    await expect(
      page.getByRole("heading", { name: "Your games, a little clearer." })
    ).toBeVisible();
    await expect(
      page.getByRole("textbox", { name: "Message Agent" })
    ).toBeFocused();
    await page.route("**/api/agent", (route) =>
      route.fulfill({
        status: 429,
        contentType: "application/json",
        body: JSON.stringify({ error: "Synthetic rate limit" }),
      })
    );
    await page
      .getByRole("textbox", { name: "Message Agent" })
      .fill("Show open games tomorrow");
    await page.getByRole("button", { name: "Send message" }).click();
    await expect(page.getByRole("alert")).toBeVisible();
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth)
    ).toBeLessThanOrEqual(width);
  });
}

test("Agent API rejects unauthenticated requests", async ({
  request,
  baseURL,
}) => {
  const response = await request.post("/api/agent", {
    headers: { origin: new URL(baseURL!).origin },
    data: { messages: [{ role: "user", content: "My games?" }] },
  });
  expect(response.status()).toBe(401);
});

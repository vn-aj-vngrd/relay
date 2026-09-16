import { execFileSync } from "node:child_process";
import { mkdtemp, readFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { expect, test } from "@playwright/test";
import {
  type CreationProposal,
  creationInputSchema,
} from "../src/features/agent/creation-schema";

let bundle: string;
let markdownStyles: string;
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
  markdownStyles = await readFile(join(directory, "fixture.css"), "utf8");
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
    await page.route("**/__synthetic-agent**", (route) =>
      route.fulfill({
        contentType: "text/html",
        body: `<html><head><meta name="viewport" content="width=device-width, initial-scale=1">${styles}</head><body><div id="agent-fixture"></div></body></html>`,
      })
    );
    let creation: CreationProposal | null = null;
    let approvals = 0;
    await page.route("**/api/agent/creations**", async (route) => {
      const request = route.request();
      const action =
        request.method() === "GET"
          ? null
          : (request.postDataJSON() as { action: string });
      if (action?.action === "confirm" && creation) {
        approvals++;
        creation = {
          ...creation,
          status: "completed",
          destination: "/groups/synthetic",
        };
      }
      await route.fulfill({
        contentType: "application/json",
        body: JSON.stringify(
          new URL(request.url()).searchParams.has("options")
            ? { groups: [], hostedGames: [], courts: [] }
            : request.method() === "GET"
              ? { proposals: creation ? [creation] : [] }
              : creation
        ),
      });
    });
    const conversation = {
      id: "123e4567-e89b-42d3-a456-426614174000",
      title: "When is my next game?",
      updatedAt: "2030-09-01T00:00:00.000Z",
      pending: false,
      messages: [
        { id: "question", role: "user", content: "When is my next game?" },
        {
          id: "reply",
          role: "assistant",
          content:
            "**Synthetic answer:** your game is tomorrow.\n\n- Bring a paddle\n\n[Guide](/help/create-game)",
        },
      ],
    };
    await page.route("**/api/agent/conversations**", (route) =>
      route.fulfill({
        contentType: "application/json",
        body: JSON.stringify(
          route.request().method() === "GET" &&
            new URL(route.request().url()).pathname.endsWith("conversations")
            ? { conversations: [conversation], hasMore: false }
            : conversation
        ),
      })
    );
    await page.route("**/api/agent", (route) => {
      if (route.request().method() !== "GET") {
        const body = route.request().postDataJSON() as {
          messageId: string;
          messages: { content: string }[];
        };
        const text = body.messages.at(-1)?.content ?? "";
        if (
          text.startsWith("Create group") ||
          creation?.status === "collecting"
        ) {
          const ready = text === "Synthetic crew";
          creation = {
            id: "creation",
            messageId: body.messageId,
            input: creationInputSchema.parse({
              kind: "group",
              title: ready ? text : undefined,
              interactionMode: "chat",
            }),
            status: ready ? "pending" : "collecting",
            preview: {
              title: ready ? text : "Create group",
              collecting: !ready,
              lines: ["You are the owner."],
              people: [],
            },
            destination: null,
            expiresAt: "2099-01-01T00:00:00Z",
          };
          return route.fulfill({
            contentType: "text/plain",
            body: ready
              ? "Review your group before approving."
              : "What would you like to name your group?",
          });
        }
      }
      return route.fulfill(
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
              body: "**Synthetic answer:** your game is tomorrow.\n\n- Bring a paddle\n\n[Guide](/help/create-game)",
            }
      );
    });
    await page.goto("/__synthetic-agent");
    await page.addStyleTag({ content: markdownStyles });
    await page.addScriptTag({ content: bundle });
    await page.getByRole("button", { name: "Actions", exact: true }).click();
    await expect(
      page.getByRole("button", { name: "Actions", exact: true })
    ).toHaveAttribute("aria-expanded", "true");
    await expect(
      page.getByRole("button", { name: "Actions", exact: true })
    ).toHaveClass(/bg-surface-strong/);
    await expect(
      page.getByRole("option", { name: /Create a game/ })
    ).toBeVisible();
    await expect(
      page.getByRole("link", { name: "All capabilities & help" })
    ).toHaveAttribute("href", "/help/agent-capabilities");
    await page.keyboard.press("Escape");
    await expect(
      page.getByRole("button", { name: "Actions", exact: true })
    ).toHaveAttribute("aria-expanded", "false");
    const slashComposer = page.getByRole("textbox", { name: "Message Agent" });
    await slashComposer.fill("/court");
    await expect(
      page.getByRole("listbox", { name: "Available Agent actions" })
    ).toBeVisible();
    await slashComposer.press("Enter");
    await expect(slashComposer).toHaveText("Find courts near me.");
    await expect(
      page.getByRole("listbox", { name: "Available Agent actions" })
    ).toHaveCount(0);
    await slashComposer.fill("");

    await page.getByRole("button", { name: "Actions", exact: true }).click();
    await page
      .getByRole("option", { name: /Create a group Help me create a group/ })
      .click();
    await expect(
      page.getByRole("region", { name: "Creation progress" })
    ).toBeVisible();
    await expect(page.getByRole("log")).toContainText(
      "What would you like to name your group?"
    );
    await expect(page.getByRole("dialog")).toHaveCount(0);
    await slashComposer.fill("Synthetic crew");
    await page.getByRole("button", { name: "Send message" }).click();
    await expect(
      page.getByRole("button", { name: "Approve & create group" })
    ).toBeVisible();
    expect(approvals).toBe(0);
    await page.getByRole("button", { name: "Approve & create group" }).click();
    await expect(page.getByRole("link", { name: "Open group" })).toBeVisible();
    expect(approvals).toBe(1);
    creation = null;
    const newChat = page.getByRole("button", { name: "New chat", exact: true });
    if (width < 1024) {
      const bounds = await newChat.boundingBox();
      const historyBounds = await page
        .getByRole("button", { name: /^Chat history:/ })
        .boundingBox();
      expect(bounds).not.toBeNull();
      expect(historyBounds).not.toBeNull();
      await expect(
        newChat.locator("span", { hasText: "New chat" }).first()
      ).toBeVisible();
      expect(bounds!.height).toBeGreaterThanOrEqual(36);
      expect(bounds!.x + bounds!.width).toBeLessThanOrEqual(width - 12);
      expect(historyBounds!.x + historyBounds!.width).toBeLessThanOrEqual(
        bounds!.x
      );
      await expect(newChat).toBeInViewport();
    }
    await newChat.click();

    if (width < 1024) {
      await expect(
        page.getByRole("link", { name: "Back to Home" })
      ).toBeVisible();
      await expect(
        page.getByRole("heading", { name: "Agent conversation", exact: true })
      ).toHaveClass(/sr-only/);
    }
    await expect(
      page.getByRole("button", { name: "Find courts near me." })
    ).toBeVisible();
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
    await expect(page.getByRole("log").locator("strong")).toHaveText(
      "Synthetic answer:"
    );
    await page
      .getByRole("textbox", { name: "Message Agent" })
      .fill("Draft question");
    await page.keyboard.press("ControlOrMeta+a");
    await page.keyboard.press("ControlOrMeta+b");
    await expect(
      page.getByRole("textbox", { name: "Message Agent" }).locator("strong")
    ).toHaveText("Draft question");
    await page.getByRole("button", { name: "Toggle Agent page" }).click();
    await page.getByRole("button", { name: "Toggle Agent page" }).click();
    await expect(page.getByRole("log")).toContainText("Synthetic answer");
    await expect(
      page.getByRole("textbox", { name: "Message Agent" }).locator("strong")
    ).toHaveText("Draft question");
    await page.reload();
    await page.addStyleTag({ content: markdownStyles });
    await page.addScriptTag({ content: bundle });
    await expect(page.getByRole("log")).toContainText("Synthetic answer");
    await page.getByRole("button", { name: /^Chat history:/ }).click();
    await expect(
      page.getByRole("list", { name: "Recent chats" })
    ).toBeVisible();
    await expect(
      page.getByRole("link", { name: "See all chats" })
    ).toHaveAttribute("href", "/agent/history");
    await page.keyboard.press("Escape");
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

import { fireEvent, render, screen, within } from "@testing-library/react";
import { expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ read: vi.fn() }));
vi.mock("./history-client", () => ({ historyRequest: mocks.read }));

import { AgentHistoryPanel } from "./history-panel";

it("shows a minimal recent-chat dropdown with a full-history link", async () => {
  mocks.read.mockResolvedValue({
    conversations: Array.from({ length: 8 }, (_, index) => ({
      id: String(index),
      title: `Chat ${index}`,
      updatedAt: new Date(Date.now() - 11 * 86_400_000).toISOString(),
    })),
  });
  render(
    <AgentHistoryPanel
      disabled={false}
      activeId={null}
      activeTitle="Your chats"
      onSelect={vi.fn()}
    />
  );
  const trigger = screen.getByRole("button", {
    name: "Chat history: Your chats",
  });
  fireEvent.click(trigger);
  const list = await screen.findByRole("list", { name: "Recent chats" });
  expect(within(list).getAllByRole("listitem")).toHaveLength(6);
  expect(within(list).getAllByText("1w")).toHaveLength(6);
  expect(
    screen.queryByRole("button", { name: /Rename/ })
  ).not.toBeInTheDocument();
  expect(screen.getByRole("link", { name: "See all chats" })).toHaveAttribute(
    "href",
    "/agent/history"
  );
  fireEvent.keyDown(document, { key: "Escape" });
  expect(
    screen.queryByRole("list", { name: "Recent chats" })
  ).not.toBeInTheDocument();
  expect(trigger).toHaveFocus();
});

it("keeps the history footer separate from bounded, truncated recent rows", async () => {
  const title = "A long conversation title ".repeat(4).trim();
  mocks.read.mockResolvedValue({
    conversations: [{ id: "long", title, updatedAt: new Date().toISOString() }],
  });
  render(
    <AgentHistoryPanel
      disabled={false}
      activeId={null}
      activeTitle={title}
      onSelect={vi.fn()}
    />
  );
  const trigger = screen.getByRole("button", {
    name: `Chat history: ${title}`,
  });
  fireEvent.click(trigger);
  const list = await screen.findByRole("list", { name: "Recent chats" });
  expect(within(list).getByText(title)).toHaveClass("truncate");
  expect(list.parentElement).toHaveClass("overflow-y-auto");
  const panel = document.getElementById(
    trigger.getAttribute("aria-controls") ?? ""
  );
  expect(panel).toHaveClass("max-h-[min(24rem,calc(100dvh-8rem))]");
  const link = screen.getByRole("link", { name: "See all chats" });
  expect(list.parentElement).not.toContainElement(link);
  expect(link.parentElement).toHaveClass("shrink-0", "border-t");
  fireEvent.click(link);
  expect(
    screen.queryByRole("list", { name: "Recent chats" })
  ).not.toBeInTheDocument();
});

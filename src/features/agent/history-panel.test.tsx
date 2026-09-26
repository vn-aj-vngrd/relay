import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import { expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ read: vi.fn() }));
vi.mock("./history-client", () => ({ historyRequest: mocks.read }));

import { AgentHistoryPanel } from "./history-panel";

it("pauses recent chat polling in hidden tabs and refreshes on return", async () => {
  const visibility = vi.spyOn(document, "visibilityState", "get");
  const intervals = vi.spyOn(window, "setInterval");
  visibility.mockReturnValue("visible");
  mocks.read.mockResolvedValue({ conversations: [] });
  try {
    render(
      <AgentHistoryPanel
        disabled={false}
        activeId={null}
        activeTitle="Your chats"
        onSelect={vi.fn()}
      />
    );
    fireEvent.click(
      screen.getByRole("button", { name: "Chat history: Your chats" })
    );
    await waitFor(() => expect(mocks.read).toHaveBeenCalled());
    const refresh = intervals.mock.calls.find(
      ([, delay]) => delay === 3000
    )?.[0];
    expect(refresh).toBeDefined();
    const initial = mocks.read.mock.calls.length;
    visibility.mockReturnValue("hidden");
    await act(async () => {
      (refresh as () => void)();
      fireEvent(document, new Event("visibilitychange"));
    });
    expect(mocks.read).toHaveBeenCalledTimes(initial);
    visibility.mockReturnValue("visible");
    fireEvent(document, new Event("visibilitychange"));
    await waitFor(() => expect(mocks.read).toHaveBeenCalledTimes(initial + 1));
  } finally {
    visibility.mockRestore();
    intervals.mockRestore();
  }
});

it("shows recent-chat progress and a full-history link without row actions", async () => {
  mocks.read.mockResolvedValue({
    conversations: Array.from({ length: 8 }, (_, index) => ({
      id: String(index),
      title: `Chat ${index}`,
      updatedAt: new Date(Date.now() - 11 * 86_400_000).toISOString(),
      status: index === 0 ? "working" : "done",
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
    within(list).getByRole("img", { name: "Working" })
  ).toBeInTheDocument();
  expect(within(list).getAllByRole("img", { name: "Done" })).toHaveLength(5);
  expect(
    screen.queryByRole("button", { name: /Archive Chat/ })
  ).not.toBeInTheDocument();
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

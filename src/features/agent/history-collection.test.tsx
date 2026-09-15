import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import { afterEach, beforeEach, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ read: vi.fn(), push: vi.fn() }));
vi.mock("./history-client", () => ({ historyRequest: mocks.read }));
vi.mock("next/navigation", () => ({ useRouter: () => ({ push: mocks.push }) }));
vi.mock("@/components/ui/action-notice", () => ({ notify: vi.fn() }));

import { AgentHistoryCollection } from "./history-collection";
import { AgentSessionProvider } from "./session";

let intersect: IntersectionObserverCallback;
let options: IntersectionObserverInit | undefined;
const row = (id: string) => ({
  id,
  title: `Chat ${id}`,
  updatedAt: "2026-09-15T12:00:00.000Z",
});
const mount = () =>
  render(
    <div className="app-scroll-surface">
      <AgentSessionProvider>
        <AgentHistoryCollection />
      </AgentSessionProvider>
    </div>
  );
const scroll = () =>
  act(() =>
    intersect(
      [{ isIntersecting: true } as IntersectionObserverEntry],
      {} as IntersectionObserver
    )
  );
beforeEach(() => {
  vi.clearAllMocks();
  mocks.read.mockReset();
  vi.stubGlobal(
    "IntersectionObserver",
    class {
      constructor(
        callback: IntersectionObserverCallback,
        config: IntersectionObserverInit
      ) {
        intersect = callback;
        options = config;
      }
      observe() {}
      disconnect() {}
    }
  );
});
afterEach(() => vi.unstubAllGlobals());
it("loads older summaries on scroll once, deduplicates rows and stops at the end", async () => {
  mocks.read.mockResolvedValueOnce({
    conversations: [row("a")],
    hasMore: true,
  });
  let resolvePage!: (value: unknown) => void;
  mocks.read.mockImplementationOnce(
    () =>
      new Promise((resolve) => {
        resolvePage = resolve;
      })
  );
  mount();
  await screen.findByRole("button", { name: "Chat a" });
  await waitFor(() =>
    expect(options?.root).toBe(
      screen.getByRole("region", { name: "Chat history list" })
    )
  );
  scroll();
  scroll();
  expect(mocks.read).toHaveBeenCalledTimes(2);
  expect(mocks.read.mock.calls[1][0]).toBe(
    "?before=2026-09-15T12%3A00%3A00.000Z&id=a"
  );
  await act(async () =>
    resolvePage({ conversations: [row("a"), row("b")], hasMore: false })
  );
  expect(
    within(screen.getByRole("list", { name: "Saved chats" })).getAllByRole(
      "listitem"
    )
  ).toHaveLength(2);
  expect(
    screen.queryByRole("button", { name: "Load older chats" })
  ).not.toBeInTheDocument();
});
it("keeps existing chats after a page failure and retries the same cursor", async () => {
  mocks.read
    .mockResolvedValueOnce({ conversations: [row("a")], hasMore: true })
    .mockRejectedValueOnce(new Error("Offline"))
    .mockResolvedValueOnce({ conversations: [row("b")], hasMore: false });
  mount();
  await screen.findByRole("button", { name: "Chat a" });
  fireEvent.click(
    await screen.findByRole("button", { name: "Load older chats" })
  );
  fireEvent.click(await screen.findByRole("button", { name: "Retry history" }));
  await screen.findByRole("button", { name: "Chat b" });
  expect(mocks.read.mock.calls[2][0]).toBe(mocks.read.mock.calls[1][0]);
  expect(screen.getByRole("button", { name: "Chat a" })).toBeInTheDocument();
});
it("cancels a pending list request on unmount", () => {
  mocks.read.mockImplementation(() => new Promise(() => {}));
  const view = mount();
  const signal = mocks.read.mock.calls[0][1].signal as AbortSignal;
  view.unmount();
  expect(signal.aborted).toBe(true);
});

it("stops automatic pagination if a response makes no cursor progress", async () => {
  mocks.read.mockResolvedValue({ conversations: [row("a")], hasMore: true });
  mount();
  fireEvent.click(
    await screen.findByRole("button", { name: "Load older chats" })
  );
  await waitFor(() => expect(mocks.read).toHaveBeenCalledTimes(2));
  await waitFor(() =>
    expect(
      screen.queryByRole("button", { name: "Load older chats" })
    ).not.toBeInTheDocument()
  );
  expect(
    within(screen.getByRole("list", { name: "Saved chats" })).getAllByRole(
      "listitem"
    )
  ).toHaveLength(1);
});

it("opens a focused rename field from an accessible icon action", async () => {
  mocks.read.mockResolvedValue({ conversations: [row("a")], hasMore: false });
  mount();
  fireEvent.click(await screen.findByRole("button", { name: "Rename Chat a" }));
  const title = screen.getByRole("textbox", { name: "Chat title" });
  expect(title).toHaveFocus();
  expect(title).toHaveValue("Chat a");
  fireEvent.keyDown(title, { key: "Escape" });
  expect(
    screen.queryByRole("textbox", { name: "Chat title" })
  ).not.toBeInTheDocument();
});

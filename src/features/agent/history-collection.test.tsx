import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import { afterEach, beforeEach, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  read: vi.fn(),
  load: vi.fn(),
  summary: vi.fn(),
  push: vi.fn(),
}));
vi.mock("./history-client", () => ({
  historyRequest: mocks.read,
  loadConversation: mocks.load,
  loadConversationSummary: mocks.summary,
}));
vi.mock("next/navigation", () => ({ useRouter: () => ({ push: mocks.push }) }));
vi.mock("@/components/ui/action-notice", () => ({ notify: vi.fn() }));

import { AgentHistoryCollection } from "./history-collection";
import {
  AgentRuntimeContext,
  AgentSessionProvider,
  createAgentSession,
} from "./session";

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
  mocks.load.mockReset();
  mocks.summary.mockReset();
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
it("shows row skeletons while Chats and Archived load", () => {
  mocks.read.mockImplementation(() => new Promise(() => {}));
  const { container } = mount();
  expect(screen.getByRole("status", { name: "Loading chats" })).toHaveAttribute(
    "aria-busy",
    "true"
  );
  expect(container.querySelectorAll(".animate-pulse")).toHaveLength(25);
  expect(screen.queryByText("Loading chats…")).not.toBeInTheDocument();

  fireEvent.click(screen.getByRole("tab", { name: "Archived" }));
  expect(screen.getByRole("tab", { name: "Archived" })).toHaveAttribute(
    "aria-selected",
    "true"
  );
  expect(
    screen.getByRole("status", { name: "Loading chats" })
  ).toBeInTheDocument();
  expect(container.querySelectorAll(".animate-pulse")).toHaveLength(25);
});
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
  await waitFor(() => expect(options?.root).toBe(screen.getByRole("tabpanel")));
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

it("updates a finished row when another tab starts a reply", async () => {
  const intervals = vi.spyOn(window, "setInterval");
  mocks.read
    .mockResolvedValueOnce({
      conversations: [{ ...row("a"), status: "done" }],
      hasMore: false,
    })
    .mockResolvedValueOnce({
      conversations: [
        {
          ...row("a"),
          updatedAt: "2026-09-15T12:05:00.000Z",
          status: "working",
        },
      ],
      hasMore: false,
    });
  mount();
  await screen.findByText("Done");
  const refresh = intervals.mock.calls
    .filter(([, delay]) => delay === 5000)
    .at(-1)?.[0];
  expect(refresh).toBeDefined();
  await act(async () => {
    (refresh as () => void)();
  });
  expect(screen.getByText("Working")).toBeInTheDocument();
  expect(screen.getByRole("button", { name: "Chat a" })).toBeInTheDocument();
  intervals.mockRestore();
});

it("reconciles chats archived or restored in another tab", async () => {
  const intervals = vi.spyOn(window, "setInterval");
  mocks.read
    .mockResolvedValueOnce({ conversations: [row("a")], hasMore: false })
    .mockResolvedValueOnce({ conversations: [], hasMore: false })
    .mockResolvedValueOnce({
      conversations: [{ ...row("a"), archivedAt: new Date().toISOString() }],
      hasMore: false,
    })
    .mockResolvedValueOnce({ conversations: [], hasMore: false });
  mount();
  await screen.findByRole("button", { name: "Chat a" });
  const activeRefresh = intervals.mock.calls
    .filter(([, delay]) => delay === 5000)
    .at(-1)?.[0];
  expect(activeRefresh).toBeDefined();
  await act(async () => {
    (activeRefresh as () => void)();
  });
  expect(
    screen.queryByRole("button", { name: "Chat a" })
  ).not.toBeInTheDocument();
  fireEvent.click(screen.getByRole("tab", { name: "Archived" }));
  await screen.findByRole("button", { name: "Chat a" });
  const archivedRefresh = intervals.mock.calls
    .filter(([, delay]) => delay === 5000)
    .at(-1)?.[0];
  expect(archivedRefresh).toBeDefined();
  await act(async () => {
    (archivedRefresh as () => void)();
  });
  expect(
    screen.queryByRole("button", { name: "Chat a" })
  ).not.toBeInTheDocument();
  expect(mocks.read.mock.calls[3][0]).toBe("?archived=true");
  intervals.mockRestore();
});

it("keeps a first-page chat displaced by a new chat when older rows are loaded", async () => {
  const intervals = vi.spyOn(window, "setInterval");
  const firstPage = Array.from({ length: 30 }, (_, index) =>
    row(String(index))
  );
  mocks.read
    .mockResolvedValueOnce({ conversations: firstPage, hasMore: true })
    .mockResolvedValueOnce({ conversations: [row("30")], hasMore: false })
    .mockResolvedValueOnce({
      conversations: [row("new"), ...firstPage.slice(0, 29)],
      hasMore: true,
    });
  mocks.summary.mockResolvedValue({ ...row("29"), archivedAt: null });
  mount();
  await screen.findByRole("button", { name: "Chat 29" });
  fireEvent.click(screen.getByRole("button", { name: "Load older chats" }));
  await screen.findByRole("button", { name: "Chat 30" });
  const refresh = intervals.mock.calls
    .filter(([, delay]) => delay === 5000)
    .at(-1)?.[0];
  expect(refresh).toBeDefined();
  await act(async () => {
    (refresh as () => void)();
  });
  expect(screen.getByRole("button", { name: "Chat new" })).toBeInTheDocument();
  expect(screen.getByRole("button", { name: "Chat 29" })).toBeInTheDocument();
  expect(screen.getByRole("button", { name: "Chat 30" })).toBeInTheDocument();
  expect(mocks.summary).toHaveBeenCalledWith("29");
  intervals.mockRestore();
});

it("opens a focused rename field from an accessible icon action", async () => {
  mocks.read.mockResolvedValue({ conversations: [row("a")], hasMore: false });
  mount();
  fireEvent.click(
    await screen.findByRole("button", { name: "More actions for Chat a" })
  );
  fireEvent.click(screen.getByRole("menuitem", { name: "Rename" }));
  const title = screen.getByRole("textbox", { name: "Chat title" });
  expect(title).toHaveFocus();
  expect(title).toHaveValue("Chat a");
  fireEvent.keyDown(title, { key: "Escape" });
  expect(
    screen.queryByRole("textbox", { name: "Chat title" })
  ).not.toBeInTheDocument();
});
it("moves chats between Chats and Archived without losing the other list", async () => {
  mocks.read.mockImplementation((path: string, init?: RequestInit) => {
    if (init?.method === "PATCH")
      return Promise.resolve({
        ...row("a"),
        archivedAt: new Date().toISOString(),
        status: "idle",
      });
    return Promise.resolve({
      conversations: path.includes("archived=true")
        ? [
            {
              ...row("b"),
              archivedAt: new Date().toISOString(),
              status: "done",
            },
          ]
        : [row("a")],
      hasMore: false,
    });
  });
  mount();
  fireEvent.click(
    await screen.findByRole("button", { name: "More actions for Chat a" })
  );
  fireEvent.click(screen.getByRole("menuitem", { name: "Archive" }));
  await waitFor(() =>
    expect(
      screen.queryByRole("button", { name: "Chat a" })
    ).not.toBeInTheDocument()
  );
  fireEvent.click(screen.getByRole("tab", { name: "Archived" }));
  expect(
    await screen.findByRole("button", { name: "Chat b" })
  ).toBeInTheDocument();
  expect(
    mocks.read.mock.calls.some(([path]) =>
      String(path).includes("archived=true")
    )
  ).toBe(true);
  fireEvent.click(
    screen.getByRole("button", { name: "More actions for Chat b" })
  );
  fireEvent.click(screen.getByRole("menuitem", { name: "Restore" }));
  await waitFor(() =>
    expect(
      screen.queryByRole("button", { name: "Chat b" })
    ).not.toBeInTheDocument()
  );
});
it("clears remote-pending state when archiving the selected chat", async () => {
  const session = createAgentSession();
  session.conversationId = "a";
  session.remotePending = true;
  mocks.read.mockImplementation((_path: string, init?: RequestInit) =>
    Promise.resolve(
      init?.method === "PATCH"
        ? { ...row("a"), archivedAt: new Date().toISOString() }
        : { conversations: [{ ...row("a"), status: "done" }], hasMore: false }
    )
  );
  render(
    <div className="app-scroll-surface">
      <AgentRuntimeContext value={{ get: () => session }}>
        <AgentSessionProvider userId="owner">
          <AgentHistoryCollection />
        </AgentSessionProvider>
      </AgentRuntimeContext>
    </div>
  );
  fireEvent.click(
    await screen.findByRole("button", { name: "More actions for Chat a" })
  );
  fireEvent.click(screen.getByRole("menuitem", { name: "Archive" }));
  await waitFor(() => expect(session.conversationId).toBeNull());
  expect(session.remotePending).toBe(false);
  expect(session.activity).toBe("idle");
});

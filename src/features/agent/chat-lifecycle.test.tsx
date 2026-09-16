import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  create: vi.fn(),
  load: vi.fn(),
  send: vi.fn(),
}));
vi.mock("@ai-sdk/react", async (original) => ({
  ...(await original<typeof import("@ai-sdk/react")>()),
  useChat: () => ({
    messages: [],
    sendMessage: mocks.send,
    status: "ready",
    stop: vi.fn(),
    setMessages: vi.fn(),
    clearError: vi.fn(),
  }),
}));
vi.mock("./history-client", async (original) => ({
  ...(await original<typeof import("./history-client")>()),
  createConversation: mocks.create,
  loadConversation: mocks.load,
}));
vi.mock("./composer-editor", () => ({
  AgentComposerEditor: ({
    value,
    onChange,
  }: {
    value: string;
    onChange: (value: string) => void;
  }) => (
    <input
      aria-label="Draft"
      value={value}
      onChange={(event) => onChange(event.target.value)}
    />
  ),
}));
vi.mock("./creation-cards", () => ({
  useCreationProposals: () => ({
    proposals: [],
    error: "",
    reload: vi.fn(),
  }),
  AgentCreationCard: () => null,
}));

import { AgentChat } from "./chat";
import { AgentSessionProvider } from "./session";

afterEach(() => {
  vi.unstubAllGlobals();
  vi.clearAllMocks();
});
describe("conversation creation during navigation", () => {
  it("cancels late creation and restores the unsent draft while preserving the session", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: false }));
    window.history.replaceState(null, "", "/agent");
    let resolve!: (value: { id: string; title: string }) => void;
    mocks.create.mockImplementation(
      () =>
        new Promise((done) => {
          resolve = done;
        })
    );
    const view = render(
      <AgentSessionProvider>
        <AgentChat available />
      </AgentSessionProvider>
    );
    fireEvent.click(
      screen.getByRole("button", { name: "When is my next game?" })
    );
    const signal = mocks.create.mock.calls[0][1] as AbortSignal;
    view.rerender(
      <AgentSessionProvider>
        <p>Games</p>
      </AgentSessionProvider>
    );
    window.history.replaceState(null, "", "/games");
    expect(signal.aborted).toBe(true);
    await act(async () => {
      resolve({ id: "late", title: "Next game?" });
    });
    expect(mocks.send).not.toHaveBeenCalled();
    expect(window.location.search).toBe("");
    window.history.replaceState(null, "", "/agent");
    view.rerender(
      <AgentSessionProvider>
        <AgentChat available />
      </AgentSessionProvider>
    );
    expect(screen.getByRole("textbox", { name: "Draft" })).toHaveValue(
      "When is my next game?"
    );
  });
});

it("preserves an unsent draft when a creation action starts chat", async () => {
  vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: false }));
  window.history.replaceState(null, "", "/agent");
  mocks.create.mockResolvedValue({ id: "new", title: "Create game" });
  mocks.load.mockResolvedValue({
    id: "new",
    title: "Create game",
    messages: [],
    pending: false,
  });
  render(
    <AgentSessionProvider>
      <AgentChat
        available
        capabilities={{
          allowGameData: true,
          allowCourtSearch: true,
          allowHelp: true,
          allowGameCreation: true,
          allowGroupCreation: true,
        }}
      />
    </AgentSessionProvider>
  );
  fireEvent.change(screen.getByRole("textbox", { name: "Draft" }), {
    target: { value: "Keep this unfinished thought" },
  });
  await act(async () =>
    fireEvent.click(
      screen.getByRole("button", { name: "Help me create a game." })
    )
  );
  expect(mocks.send).toHaveBeenCalledWith(
    expect.objectContaining({ text: expect.stringContaining("Create game") }),
    undefined
  );
  expect(screen.getByRole("textbox", { name: "Draft" })).toHaveValue(
    "Keep this unfinished thought"
  );
});

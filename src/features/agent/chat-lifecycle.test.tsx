import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ create: vi.fn(), send: vi.fn() }));
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
}));
vi.mock("./composer-editor", () => ({
  AgentComposerEditor: ({ value }: { value: string }) => (
    <input aria-label="Draft" value={value} readOnly />
  ),
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

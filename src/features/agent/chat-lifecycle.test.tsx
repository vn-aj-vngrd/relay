import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { type RefObject, useEffect } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  create: vi.fn(),
  load: vi.fn(),
  send: vi.fn(),
  saveDraft: vi.fn(),
  withCreation: false,
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
    proposals: mocks.withCreation
      ? [{ id: "setup", messageId: "setup-message", status: "collecting" }]
      : [],
    error: "",
    reload: vi.fn(),
  }),
  AgentCreationCard: ({
    beforeChat,
  }: {
    beforeChat: RefObject<(() => Promise<void>) | null>;
  }) => {
    useEffect(() => {
      beforeChat.current = mocks.saveDraft;
      return () => {
        beforeChat.current = null;
      };
    }, [beforeChat]);
    return <p>Creation setup</p>;
  },
}));

import { AgentChat } from "./chat";
import { AgentSessionProvider } from "./session";

afterEach(() => {
  vi.unstubAllGlobals();
  vi.clearAllMocks();
  mocks.withCreation = false;
});
describe("conversation creation during navigation", () => {
  it("does not send after navigating away during an existing conversation's setup save", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: false }));
    window.history.replaceState(null, "", "/agent?chat=existing");
    mocks.withCreation = true;
    mocks.load.mockResolvedValue({
      id: "existing",
      title: "Game setup",
      messages: [],
      pending: false,
    });
    let finishSave!: () => void;
    mocks.saveDraft.mockImplementation(
      () =>
        new Promise<void>((resolve) => {
          finishSave = resolve;
        })
    );
    const view = render(
      <AgentSessionProvider>
        <AgentChat available />
      </AgentSessionProvider>
    );
    await waitFor(() =>
      expect(
        screen.getByRole("button", { name: "New chat" })
      ).not.toBeDisabled()
    );
    fireEvent.change(screen.getByRole("textbox", { name: "Draft" }), {
      target: { value: "Make it Saturday instead" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Send message" }));
    expect(mocks.saveDraft).toHaveBeenCalledOnce();
    expect(mocks.create).not.toHaveBeenCalled();
    view.rerender(
      <AgentSessionProvider>
        <p>Games</p>
      </AgentSessionProvider>
    );
    window.history.replaceState(null, "", "/games");
    await act(async () => {
      finishSave();
    });
    expect(mocks.send).not.toHaveBeenCalled();
    window.history.replaceState(null, "", "/agent");
    view.rerender(
      <AgentSessionProvider>
        <AgentChat available />
      </AgentSessionProvider>
    );
    expect(screen.getByRole("textbox", { name: "Draft" })).toHaveValue(
      "Make it Saturday instead"
    );
  });
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

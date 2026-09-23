import { Chat } from "@ai-sdk/react";
import { act, render, screen } from "@testing-library/react";
import type { UIMessageChunk } from "ai";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { AppNav } from "@/components/shared/app-nav";
import { AgentMobileLink } from "./activity";
import { AgentRuntimeProvider } from "./runtime";
import {
  type AgentSession,
  AgentSessionProvider,
  useAgentSession,
} from "./session";

const mocks = vi.hoisted(() => ({
  auth: vi.fn(),
  pathname: "/agent",
}));
vi.mock("next/navigation", () => ({ usePathname: () => mocks.pathname }));
vi.mock("@/lib/supabase/client", () => ({
  createSupabaseBrowserClient: () => ({
    auth: { onAuthStateChange: mocks.auth },
  }),
}));

describe("root Agent runtime", () => {
  beforeEach(() => {
    mocks.pathname = "/agent";
  });
  it("shares background status across desktop and mobile and acknowledges it on return", () => {
    let authChanged!: (event: string, session: null) => void;
    mocks.auth.mockImplementation((callback) => {
      authChanged = callback;
      return { data: { subscription: { unsubscribe: vi.fn() } } };
    });
    let session!: AgentSession;
    function AgentPage() {
      session = useAgentSession();
      return null;
    }
    const page = (show: boolean) => (
      <AgentRuntimeProvider>
        <AppNav mode="sidebar" />
        <AgentMobileLink />
        {show ? (
          <AgentSessionProvider userId="user">
            <AgentPage />
          </AgentSessionProvider>
        ) : (
          <p>Quick Play</p>
        )}
      </AgentRuntimeProvider>
    );
    const view = render(page(true));
    act(() => {
      session.activity = "working";
      session.notify();
    });
    expect(
      screen.getAllByRole("link", { name: "Agent, working" })
    ).toHaveLength(2);
    mocks.pathname = "/play";
    view.rerender(page(false));
    act(() => {
      session.activity = "completed";
      session.notify();
    });
    expect(
      screen.getAllByRole("link", { name: "Agent, reply ready" })
    ).toHaveLength(2);
    mocks.pathname = "/home";
    view.rerender(page(false));
    expect(
      screen.getAllByRole("link", { name: "Agent, reply ready" })
    ).toHaveLength(2);
    mocks.pathname = "/agent";
    view.rerender(page(true));
    expect(screen.getAllByRole("link", { name: "Agent" })).toHaveLength(2);
    mocks.pathname = "/play";
    view.rerender(page(false));
    act(() => {
      session.activity = "error";
      session.notify();
    });
    expect(
      screen.getAllByRole("link", { name: "Agent, response needs attention" })
    ).toHaveLength(2);
    act(() => authChanged("SIGNED_OUT", null));
    expect(screen.getAllByRole("link", { name: "Agent" })).toHaveLength(2);
  });
  it("finishes a live reply and retains its activity while the authenticated layout is absent", async () => {
    mocks.auth.mockReturnValue({
      data: { subscription: { unsubscribe: vi.fn() } },
    });
    let session!: AgentSession;
    let controller!: ReadableStreamDefaultController<UIMessageChunk>;
    const stream = new ReadableStream<UIMessageChunk>({
      start(value) {
        controller = value;
      },
    });
    const chat = new Chat({
      transport: {
        sendMessages: async () => stream,
        reconnectToStream: async () => null,
      },
    });
    const stop = vi.spyOn(chat, "stop");
    function AgentPage() {
      session = useAgentSession();
      session.chat ??= chat;
      return null;
    }
    const page = (agent: boolean) => (
      <AgentRuntimeProvider>
        {agent ? (
          <AgentSessionProvider userId="user">
            <AgentPage />
          </AgentSessionProvider>
        ) : (
          <p>Courts</p>
        )}
      </AgentRuntimeProvider>
    );
    const view = render(page(true));
    session.conversationId = "working-chat";
    let request!: Promise<void>;
    act(() => {
      request = chat.sendMessage({ text: "Find my next game" });
    });
    view.rerender(page(false));
    expect(stop).not.toHaveBeenCalled();
    const work = {
      startedAt: 1000,
      finishedAt: 3000,
      status: "completed",
      entries: [{ step: "games", status: "complete" }],
    };
    await act(async () => {
      controller.enqueue({ type: "start", messageId: "reply" });
      controller.enqueue({ type: "text-start", id: "answer" });
      controller.enqueue({
        type: "text-delta",
        id: "answer",
        delta: "Your game is tomorrow.",
      });
      controller.enqueue({ type: "text-end", id: "answer" });
      controller.enqueue({ type: "finish", messageMetadata: { work } });
      controller.close();
      await request;
    });
    view.rerender(page(true));
    expect(session.chat).toBe(chat);
    expect(session.conversationId).toBe("working-chat");
    expect(chat.status).toBe("ready");
    expect(chat.messages.at(-1)).toMatchObject({
      metadata: { work },
      parts: [
        expect.objectContaining({
          type: "text",
          text: "Your game is tomorrow.",
        }),
      ],
    });
  });
  it("retains the session across route-layout replacement and clears it on sign-out", () => {
    let authChanged!: (event: string, session: null) => void;
    mocks.auth.mockImplementation((callback) => {
      authChanged = callback;
      return { data: { subscription: { unsubscribe: vi.fn() } } };
    });
    let session!: AgentSession;
    function AgentPage() {
      session = useAgentSession();
      return null;
    }
    const page = (agent: boolean) => (
      <AgentRuntimeProvider>
        {agent ? (
          <AgentSessionProvider userId="user">
            <AgentPage />
          </AgentSessionProvider>
        ) : (
          <p>Quick Play</p>
        )}
      </AgentRuntimeProvider>
    );
    const view = render(page(true));
    const original = session;
    const chat = new Chat({});
    const stop = vi.spyOn(chat, "stop");
    session.chat = chat;
    session.conversationId = "saved";
    session.draft = "Next question";
    const controller = new AbortController();
    session.preparation = {
      controller,
      question: { id: "question", role: "user", parts: [] },
    };
    view.rerender(page(false));
    expect(stop).not.toHaveBeenCalled();
    expect(controller.signal.aborted).toBe(false);
    view.rerender(page(true));
    expect(session).toBe(original);
    expect(session.conversationId).toBe("saved");
    expect(session.draft).toBe("Next question");
    act(() => authChanged("SIGNED_OUT", null));
    expect(stop).toHaveBeenCalledOnce();
    expect(controller.signal.aborted).toBe(true);
    expect(session.draft).toBe("");
    expect(session.conversationId).toBeNull();
  });
  it("never reuses another account's conversation", async () => {
    mocks.auth.mockReturnValue({
      data: { subscription: { unsubscribe: vi.fn() } },
    });
    let session!: AgentSession;
    function AgentPage() {
      session = useAgentSession();
      return null;
    }
    const page = (userId: string) => (
      <AgentRuntimeProvider>
        <AgentSessionProvider key={userId} userId={userId}>
          <AgentPage />
        </AgentSessionProvider>
      </AgentRuntimeProvider>
    );
    const view = render(page("first"));
    const previous = session;
    previous.draft = "Private draft";
    previous.conversationId = "private-chat";
    await act(async () => view.rerender(page("second")));
    expect(session).not.toBe(previous);
    expect(session.conversationId).toBeNull();
    expect(session.draft).toBe("");
    expect(previous.draft).toBe("");
  });
});

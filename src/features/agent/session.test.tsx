import { Chat, useChat } from "@ai-sdk/react";
import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import type { UIMessageChunk } from "ai";
import { useState } from "react";
import { describe, expect, it, vi } from "vitest";
import { AgentSessionProvider, useAgentSession } from "./session";

function Conversation() {
  const session = useAgentSession();
  const [chat] = useState(() => {
    session.chat ??= new Chat({});
    return session.chat;
  });
  const { messages, setMessages } = useChat({ chat });
  return (
    <>
      <p>{messages.length} messages</p>
      <p>Draft: {session.draft}</p>
      <button
        type="button"
        onClick={() => {
          session.draft = "Unsaved question";
          setMessages([
            {
              id: "one",
              role: "user",
              parts: [{ type: "text", text: "My game" }],
            },
          ]);
        }}
      >
        Prepare conversation
      </button>
      <button
        type="button"
        onClick={() => {
          session.draft = "";
          setMessages([]);
        }}
      >
        New chat
      </button>
    </>
  );
}

describe("Agent session ownership", () => {
  it("keeps a stream alive while its page is away, and stops on layout exit", async () => {
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
    function Page({ visible }: { visible: boolean }) {
      const session = useAgentSession();
      session.chat ??= chat;
      return visible ? <Conversation /> : null;
    }
    const page = (visible: boolean) => (
      <AgentSessionProvider>
        <Page visible={visible} />
      </AgentSessionProvider>
    );
    const { rerender, unmount } = render(page(true));
    let request!: Promise<void>;
    act(() => {
      request = chat.sendMessage({ text: "My next game?" });
    });
    await waitFor(() => expect(chat.status).toBe("submitted"));
    rerender(page(false));
    expect(stop).not.toHaveBeenCalled();
    await act(async () => {
      controller.enqueue({ type: "start", messageId: "answer" });
      controller.enqueue({ type: "text-start", id: "text" });
      controller.enqueue({ type: "text-delta", id: "text", delta: "Tomorrow" });
      controller.enqueue({ type: "text-end", id: "text" });
      controller.enqueue({ type: "finish" });
      controller.close();
      await request;
    });
    rerender(page(true));
    expect(screen.getByText("2 messages")).toBeInTheDocument();
    expect(chat.messages[1].parts).toContainEqual(
      expect.objectContaining({ type: "text", text: "Tomorrow" })
    );
    unmount();
    expect(stop).toHaveBeenCalledOnce();
  });
  it("retains messages and draft across page navigation, and clears on a new user", () => {
    const page = (show: boolean, user = "first") => (
      <AgentSessionProvider key={user}>
        {show ? <Conversation /> : <p>Games page</p>}
      </AgentSessionProvider>
    );
    const { rerender } = render(page(true));
    fireEvent.click(screen.getByText("Prepare conversation"));
    rerender(page(false));
    rerender(page(true));
    expect(screen.getByText("1 messages")).toBeInTheDocument();
    expect(screen.getByText("Draft: Unsaved question")).toBeInTheDocument();
    rerender(page(true, "second"));
    expect(screen.getByText("0 messages")).toBeInTheDocument();
    expect(
      screen.queryByText("Draft: Unsaved question")
    ).not.toBeInTheDocument();
  });
  it("keeps a cleared conversation empty after navigation", () => {
    const page = (show: boolean) => (
      <AgentSessionProvider>
        {show ? <Conversation /> : null}
      </AgentSessionProvider>
    );
    const { rerender } = render(page(true));
    fireEvent.click(screen.getByText("Prepare conversation"));
    fireEvent.click(screen.getByText("New chat"));
    rerender(page(false));
    rerender(page(true));
    expect(screen.getByText("0 messages")).toBeInTheDocument();
    expect(
      screen.queryByText("Draft: Unsaved question")
    ).not.toBeInTheDocument();
  });
});

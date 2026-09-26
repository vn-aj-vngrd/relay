import {
  act,
  fireEvent,
  render as renderComponent,
  screen,
  waitFor,
} from "@testing-library/react";
import type { UIMessage } from "ai";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import composerStyles from "./composer.module.css";
import { creationInputSchema } from "./creation-schema";

const mocks = vi.hoisted(() => ({
  create: vi.fn(),
  load: vi.fn(),
  history: vi.fn(),
  send: vi.fn(),
  stop: vi.fn(),
  clear: vi.fn(),
  reset: vi.fn(),
  retry: vi.fn(),
  status: "ready",
  error: undefined as Error | undefined,
  messages: [] as UIMessage[],
}));
vi.mock("@ai-sdk/react", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@ai-sdk/react")>()),
  useChat: () => ({
    messages: mocks.messages,
    sendMessage: mocks.send,
    stop: mocks.stop,
    clearError: mocks.clear,
    setMessages: mocks.reset,
    regenerate: mocks.retry,
    status: mocks.status,
    error: mocks.error,
  }),
}));

vi.mock("./history-client", async (importOriginal) => ({
  ...(await importOriginal<typeof import("./history-client")>()),
  createConversation: mocks.create,
  loadConversation: mocks.load,
  historyRequest: mocks.history,
  setConversationUrl: vi.fn(),
}));

import { AgentChat } from "./chat";
import { AgentSessionProvider } from "./session";

const render = (ui: React.ReactNode) =>
  renderComponent(ui, { wrapper: AgentSessionProvider });

afterEach(() => vi.unstubAllGlobals());
beforeEach(() => {
  vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: false }));
  vi.clearAllMocks();
  window.history.replaceState(null, "", "/agent");
  mocks.create.mockResolvedValue({
    id: "chat",
    title: "Next game?",
    updatedAt: new Date().toISOString(),
  });
  mocks.history.mockResolvedValue({ conversations: [] });
  mocks.status = "ready";
  mocks.error = undefined;
  mocks.messages = [];
});
describe("Agent chat controls", () => {
  it("places saved creation setup after Agent's latest reply", async () => {
    const userMessage: UIMessage = {
      id: "question",
      role: "user",
      parts: [{ type: "text", text: "Help me create a game" }],
    };
    const answer: UIMessage = {
      id: "answer",
      role: "assistant",
      parts: [{ type: "text", text: "When should the game be?" }],
    };
    mocks.messages = [userMessage, answer];
    window.history.replaceState(null, "", "/agent?chat=saved");
    mocks.load.mockResolvedValue({
      id: "saved",
      title: "Create game",
      messages: [userMessage, answer],
      pending: false,
    });
    vi.stubGlobal(
      "fetch",
      vi.fn().mockImplementation((url: string) =>
        Promise.resolve(
          url.startsWith("/api/agent/creations?")
            ? {
                ok: true,
                json: async () => ({
                  proposals: [
                    {
                      id: "proposal",
                      messageId: "question",
                      status: "collecting",
                      input: creationInputSchema.parse({ kind: "game" }),
                      preview: {
                        title: "Create game",
                        lines: [],
                        people: [],
                      },
                      destination: null,
                      expiresAt: new Date(Date.now() + 60_000).toISOString(),
                    },
                  ],
                }),
              }
            : { ok: false }
        )
      )
    );
    render(
      <AgentChat
        available
        capabilities={{
          allowGameData: true,
          allowCourtSearch: false,
          allowHelp: true,
          allowGameCreation: true,
          allowGroupCreation: false,
        }}
      />
    );
    const card = await screen.findByRole("region", {
      name: "Creation progress",
    });
    const reply = screen.getByText("When should the game be?");
    expect(
      reply.compareDocumentPosition(card) & Node.DOCUMENT_POSITION_FOLLOWING
    ).toBeTruthy();
    expect(
      screen.getAllByRole("region", { name: "Creation progress" })
    ).toHaveLength(1);
  });
  it("keeps New chat from replacing a conversation while another reply is active", async () => {
    window.history.replaceState(null, "", "/agent?chat=saved");
    mocks.load.mockResolvedValue({
      id: "saved",
      title: "Saved chat",
      messages: [],
      pending: false,
    });
    mocks.history.mockResolvedValue({
      conversations: [{ id: "other", status: "working" }],
    });
    render(<AgentChat available />);
    await screen.findByRole("button", { name: "Chat history: Saved chat" });
    const restoredCount = mocks.reset.mock.calls.length;
    await waitFor(() =>
      expect(screen.getByRole("button", { name: "New chat" })).toBeDisabled()
    );
    expect(mocks.reset).toHaveBeenCalledTimes(restoredCount);
    expect(
      screen.getByRole("button", { name: "Chat history: Saved chat" })
    ).toBeInTheDocument();
  });
  it("retries the existing turn instead of sending another question", async () => {
    mocks.error = new Error("AGENT_HTTP_502");
    render(<AgentChat available />);
    fireEvent.click(await screen.findByRole("button", { name: "Retry" }));
    expect(mocks.retry).toHaveBeenCalledOnce();
    expect(mocks.send).not.toHaveBeenCalled();
    expect(mocks.create).not.toHaveBeenCalled();
  });
  it("locks repeated retry clicks until regeneration settles", async () => {
    mocks.error = new Error("AGENT_HTTP_502");
    let finish!: () => void;
    mocks.retry.mockImplementation(
      () =>
        new Promise<void>((resolve) => {
          finish = resolve;
        })
    );
    render(<AgentChat available />);
    const retry = await screen.findByRole("button", { name: "Retry" });
    act(() => {
      fireEvent.click(retry);
      fireEvent.click(retry);
    });
    expect(mocks.retry).toHaveBeenCalledOnce();
    await act(async () => {
      finish();
    });
    fireEvent.click(retry);
    expect(mocks.retry).toHaveBeenCalledTimes(2);
    await act(async () => {
      finish();
    });
    mocks.retry.mockReset();
  });
  it("shows a message skeleton until the saved conversation loads", async () => {
    window.history.replaceState(null, "", "/agent?chat=saved");
    let finish!: (value: {
      id: string;
      title: string;
      messages: [];
      pending: boolean;
    }) => void;
    mocks.load.mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          finish = resolve;
        })
    );
    render(<AgentChat available />);
    expect(
      screen.getByRole("status", { name: "Restoring chat" })
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("heading", { name: "Your games, a little clearer." })
    ).not.toBeInTheDocument();
    finish({ id: "saved", title: "Saved chat", messages: [], pending: false });
    await waitFor(() =>
      expect(
        screen.queryByRole("status", { name: "Restoring chat" })
      ).not.toBeInTheDocument()
    );
  });
  it("opens an archived chat for reading without allowing a new reply", async () => {
    window.history.replaceState(null, "", "/agent?chat=archived");
    mocks.load.mockResolvedValue({
      id: "archived",
      title: "Old chat",
      archivedAt: new Date().toISOString(),
      messages: [],
      pending: false,
    });
    render(<AgentChat available />);
    expect(
      await screen.findByText(
        "This chat is archived. Restore it from Chat history to continue."
      )
    ).toBeInTheDocument();
    expect(
      screen.getByRole("textbox", { name: "Message Agent" })
    ).toHaveAttribute("contenteditable", "false");
  });
  it("shows the question immediately while a suggested chat is being created", async () => {
    let finish!: (value: { id: string; title: string }) => void;
    mocks.create.mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          finish = resolve;
        })
    );
    render(<AgentChat available />);
    fireEvent.click(
      screen.getByRole("button", { name: "When is my next game?" })
    );
    expect(
      screen.queryByRole("heading", { name: "Your games, a little clearer." })
    ).not.toBeInTheDocument();
    expect(screen.getByRole("article", { name: "You" })).toHaveTextContent(
      "When is my next game?"
    );
    expect(mocks.send).not.toHaveBeenCalled();
    finish({ id: "chat", title: "Next game?" });
    await waitFor(() => expect(mocks.send).toHaveBeenCalledTimes(1));
  });
  it("restores the question in the composer if chat creation fails", async () => {
    mocks.create.mockRejectedValueOnce(new Error("Offline"));
    render(<AgentChat available />);
    fireEvent.click(
      screen.getByRole("button", { name: "When is my next game?" })
    );
    await waitFor(() =>
      expect(
        screen.getByRole("textbox", { name: "Message Agent" })
      ).toHaveTextContent("When is my next game?")
    );
    expect(mocks.send).not.toHaveBeenCalled();
  });
  it("renders pasted Markdown directly in the composer without a toolbar", async () => {
    render(<AgentChat available />);
    const input = await screen.findByRole("textbox", { name: "Message Agent" });
    fireEvent.paste(input, {
      clipboardData: { getData: () => "**Next game**" },
    });
    expect(input.querySelector("strong")).toHaveTextContent("Next game");
    expect(input).not.toHaveTextContent("**");
    expect(
      screen.queryByRole("group", { name: "Message formatting" })
    ).not.toBeInTheDocument();
  });
  it("uses the conversation title to open history and updates it after saving", async () => {
    render(<AgentChat available />);
    expect(
      screen.getByRole("button", { name: "Chat history: Your chats" })
    ).toBeInTheDocument();
    fireEvent.click(
      screen.getByRole("button", { name: "When is my next game?" })
    );
    await waitFor(() =>
      expect(
        screen.getByRole("button", { name: "Chat history: Next game?" })
      ).toBeInTheDocument()
    );
    expect(
      screen.queryByRole("heading", { name: "Agent" })
    ).not.toBeInTheDocument();
  });
  it("sends nearby questions without device location controls", async () => {
    render(<AgentChat available allowCourtSearch />);
    fireEvent.click(
      screen.getByRole("button", { name: "Find courts near me." })
    );
    await waitFor(() =>
      expect(mocks.send).toHaveBeenCalledWith(
        expect.objectContaining({
          parts: [{ type: "text", text: "Find courts near me." }],
        }),
        undefined
      )
    );
    expect(
      screen.queryByRole("button", { name: "Use my location" })
    ).not.toBeInTheDocument();
  });
  it("hides court entry points when the capability is off", () => {
    render(<AgentChat available allowCourtSearch={false} />);
    expect(
      screen.queryByRole("button", { name: "Use my location" })
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Find courts near me." })
    ).not.toBeInTheDocument();
  });
  it("uses the composer border instead of a second editor focus ring", async () => {
    render(<AgentChat available />);
    const input = await screen.findByRole("textbox", { name: "Message Agent" });
    expect(input).toHaveClass("agent-composer-input");
    expect(input.closest("form")).toHaveClass(composerStyles.composer);
  });
  it("caps oversized pastes and asks the user to review before sending", async () => {
    render(<AgentChat available />);
    const input = await screen.findByRole("textbox", { name: "Message Agent" });
    fireEvent.paste(input, {
      clipboardData: { getData: () => "x".repeat(4100) },
    });
    expect(input).toHaveTextContent("x".repeat(4000));
    expect(screen.getByRole("alert")).toHaveTextContent(
      "Extra text was removed"
    );
    expect(mocks.send).not.toHaveBeenCalled();
    expect(input.textContent).toHaveLength(4000);
    expect(screen.queryByText("4,000 / 4,000 characters")).toBeNull();
  });
  it("shows elapsed work and request activity while waiting for a response", () => {
    mocks.status = "submitted";
    render(<AgentChat available />);
    expect(screen.getByText("Working for 0s")).toBeInTheDocument();
    expect(
      screen.getByRole("list", { name: "Agent activity" })
    ).toHaveTextContent("Reviewing your request");
  });
  it("places a failed response and Retry inside the Agent conversation", () => {
    mocks.error = new Error("AGENT_HTTP_502");
    render(<AgentChat available />);
    const alert = screen.getByRole("alert");
    expect(screen.getByRole("log")).toContainElement(alert);
    expect(screen.getByRole("article", { name: "Agent" })).toContainElement(
      alert
    );
    expect(screen.getByRole("article", { name: "Agent" })).toContainElement(
      screen.getByRole("button", { name: "Retry" })
    );
  });
  it("submits a natural-language suggestion", async () => {
    render(<AgentChat available />);
    fireEvent.click(
      screen.getByRole("button", { name: "When is my next game?" })
    );
    await waitFor(() =>
      expect(mocks.send).toHaveBeenCalledWith(
        expect.objectContaining({
          parts: [{ type: "text", text: "When is my next game?" }],
        }),
        undefined
      )
    );
  });
  it("keeps unavailable Agent inputs disabled", async () => {
    render(<AgentChat available={false} />);
    expect(
      await screen.findByRole("textbox", { name: "Message Agent" })
    ).toHaveAttribute("contenteditable", "false");
    fireEvent.click(
      screen.getByRole("button", { name: "When is my next game?" })
    );
    expect(mocks.send).not.toHaveBeenCalled();
  });
  it("labels the icon-only Stop control and prevents duplicate submission", async () => {
    mocks.status = "streaming";
    render(<AgentChat available />);
    const stop = screen.getByRole("button", { name: "Stop response" });
    expect(stop).not.toHaveTextContent("Stop");
    expect(screen.queryByRole("button", { name: "Send message" })).toBeNull();
    fireEvent.focus(stop);
    expect(await screen.findByRole("tooltip")).toHaveTextContent(
      "Stop response"
    );
    fireEvent.click(stop);
    expect(mocks.stop).toHaveBeenCalledOnce();
    fireEvent.click(
      screen.getByRole("button", { name: "When is my next game?" })
    );
    expect(mocks.send).not.toHaveBeenCalled();
  });
  it("does not describe pending reservations as permanently used messages", () => {
    mocks.error = new Error("AGENT_HTTP_402");
    render(<AgentChat available />);
    expect(screen.getByRole("alert")).toHaveTextContent(
      "No Agent messages are currently available"
    );
    expect(screen.getByRole("alert")).toHaveTextContent("in progress");
  });
  it("shows useful quota recovery without exposing raw errors", () => {
    mocks.error = new Error("AGENT_HTTP_429");
    const { rerender } = render(<AgentChat available />);
    expect(screen.getByRole("alert")).toHaveTextContent("hourly limit");
    mocks.error = new Error("SECRET_PROVIDER_RESPONSE");
    rerender(<AgentChat available />);
    expect(screen.getByRole("alert")).not.toHaveTextContent(
      "SECRET_PROVIDER_RESPONSE"
    );
  });
});

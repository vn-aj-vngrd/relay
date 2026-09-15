import {
  fireEvent,
  render as renderComponent,
  screen,
  waitFor,
} from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  create: vi.fn(),
  load: vi.fn(),
  send: vi.fn(),
  stop: vi.fn(),
  clear: vi.fn(),
  reset: vi.fn(),
  retry: vi.fn(),
  status: "ready",
  error: undefined as Error | undefined,
}));
vi.mock("@ai-sdk/react", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@ai-sdk/react")>()),
  useChat: () => ({
    messages: [],
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
  mocks.status = "ready";
  mocks.error = undefined;
});
describe("Agent chat controls", () => {
  it("retries the existing turn instead of sending another question", async () => {
    mocks.error = new Error("AGENT_HTTP_502");
    render(<AgentChat available />);
    fireEvent.click(await screen.findByRole("button", { name: "Retry" }));
    expect(mocks.retry).toHaveBeenCalledOnce();
    expect(mocks.send).not.toHaveBeenCalled();
    expect(mocks.create).not.toHaveBeenCalled();
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
        expect.objectContaining({ text: "Find courts near me." }),
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
    expect(input.closest("form")).toHaveClass("focus-within:border-primary");
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
    expect(screen.getByText("4,000 / 4,000 characters")).toBeInTheDocument();
  });
  it("uses shimmer text while waiting for the first response", () => {
    mocks.status = "submitted";
    render(<AgentChat available />);
    expect(screen.getByText("Thinking…")).toHaveClass("text-shimmer");
  });
  it("picks a fresh label per request and keeps it stable during loading", async () => {
    const random = vi.spyOn(Math, "random").mockReturnValue(0);
    try {
      const { rerender } = render(<AgentChat available />);
      const ask = () =>
        fireEvent.click(
          screen.getByRole("button", { name: "When is my next game?" })
        );
      ask();
      await waitFor(() => expect(mocks.send).toHaveBeenCalled());
      mocks.send.mockClear();
      mocks.status = "submitted";
      rerender(<AgentChat available />);
      expect(screen.getByText("Pondering…")).toHaveClass("text-shimmer");
      rerender(<AgentChat available />);
      expect(screen.getByText("Pondering…")).toBeInTheDocument();
      mocks.status = "ready";
      rerender(<AgentChat available />);
      ask();
      await waitFor(() => expect(mocks.send).toHaveBeenCalled());
      mocks.send.mockClear();
      mocks.status = "submitted";
      rerender(<AgentChat available />);
      expect(screen.getByText("Thinking…")).toBeInTheDocument();
    } finally {
      random.mockRestore();
    }
  });
  it("submits a natural-language suggestion", async () => {
    render(<AgentChat available />);
    fireEvent.click(
      screen.getByRole("button", { name: "When is my next game?" })
    );
    await waitFor(() =>
      expect(mocks.send).toHaveBeenCalledWith(
        expect.objectContaining({ text: "When is my next game?" }),
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
  it("stops streaming and prevents duplicate submission", () => {
    mocks.status = "streaming";
    render(<AgentChat available />);
    fireEvent.click(screen.getByRole("button", { name: "Stop response" }));
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

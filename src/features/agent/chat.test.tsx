import { fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  send: vi.fn(),
  stop: vi.fn(),
  clear: vi.fn(),
  reset: vi.fn(),
  retry: vi.fn(),
  status: "ready",
  error: undefined as Error | undefined,
}));
vi.mock("@ai-sdk/react", () => ({
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

import { AgentChat } from "./chat";

afterEach(() => vi.unstubAllGlobals());
beforeEach(() => {
  vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: false }));
  vi.clearAllMocks();
  mocks.status = "ready";
  mocks.error = undefined;
});
describe("Agent chat controls", () => {
  it("uses the composer border instead of a second textarea focus ring", () => {
    render(<AgentChat available />);
    const input = screen.getByRole("textbox", { name: "Message Agent" });
    expect(input).toHaveClass("agent-composer-input");
    expect(input.closest("form")).toHaveClass("focus-within:border-primary");
  });
  it("caps oversized pastes and asks the user to review before sending", () => {
    render(<AgentChat available />);
    const input = screen.getByRole("textbox", { name: "Message Agent" });
    fireEvent.paste(input, {
      clipboardData: { getData: () => "x".repeat(4100) },
    });
    expect(input).toHaveValue("x".repeat(4000));
    expect(screen.getByRole("alert")).toHaveTextContent(
      "Extra text was removed"
    );
    expect(mocks.send).not.toHaveBeenCalled();
    expect(screen.getByText("4,000 / 4,000 characters")).toBeInTheDocument();
  });
  it("uses shimmer text while waiting for the first response", () => {
    mocks.status = "submitted";
    render(<AgentChat available />);
    expect(screen.getByText("Looking into your question…")).toHaveClass(
      "text-shimmer"
    );
  });
  it("submits a natural-language suggestion", () => {
    render(<AgentChat available />);
    fireEvent.click(
      screen.getByRole("button", { name: "When is my next game?" })
    );
    expect(mocks.send).toHaveBeenCalledWith({ text: "When is my next game?" });
  });
  it("keeps unavailable Agent inputs disabled", () => {
    render(<AgentChat available={false} />);
    expect(
      screen.getByRole("textbox", { name: "Message Agent" })
    ).toBeDisabled();
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

import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ notify: vi.fn() }));
vi.mock("@/components/ui/action-notice", () => ({ notify: mocks.notify }));

import { AgentReplyActions } from "./reply-actions";

const originalClipboard = Object.getOwnPropertyDescriptor(
  navigator,
  "clipboard"
);
const originalFetch = globalThis.fetch;
beforeEach(() => {
  HTMLDialogElement.prototype.showModal = function showModal() {
    this.open = true;
  };
  HTMLDialogElement.prototype.close = function close() {
    this.open = false;
    this.dispatchEvent(new Event("close"));
  };
});
afterEach(() => {
  globalThis.fetch = originalFetch;
  if (originalClipboard)
    Object.defineProperty(navigator, "clipboard", originalClipboard);
  else Reflect.deleteProperty(navigator, "clipboard");
  vi.clearAllMocks();
});
describe("Agent reply copy", () => {
  it("shows the supplied message time and copies a user's message", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: { writeText },
    });
    const timestamp = new Date("2026-09-23T07:39:00.000Z");
    const { container } = render(
      <AgentReplyActions text="My question" user timestamp={timestamp} />
    );
    expect(container.querySelector("time")).toHaveAttribute(
      "datetime",
      timestamp.toISOString()
    );
    expect(container.querySelector("time")).not.toBeEmptyDOMElement();
    fireEvent.click(screen.getByRole("button", { name: "Copy message" }));
    await waitFor(() => expect(writeText).toHaveBeenCalledWith("My question"));
    expect(screen.queryByRole("button", { name: /edit/i })).toBeNull();
    expect(screen.queryByRole("button", { name: "Good response" })).toBeNull();
    expect(screen.queryByRole("button", { name: "Needs work" })).toBeNull();
  });
  it("does not invent a timestamp for older messages without one", () => {
    const { container } = render(
      <AgentReplyActions
        text="Saved reply"
        conversationId="chat-id"
        messageId="reply-id"
      />
    );
    expect(container.querySelector("time")).toBeNull();
    expect(screen.getByRole("button", { name: "Copy reply" })).toBeEnabled();
    expect(screen.getByRole("button", { name: "Good response" })).toHaveClass(
      "min-h-11",
      "w-11"
    );
    expect(screen.getByRole("button", { name: "Needs work" })).toHaveClass(
      "min-h-11",
      "w-11"
    );
  });
  it("shows an icon-only control with a tooltip on focus", async () => {
    render(<AgentReplyActions text="Next game" />);
    const button = screen.getByRole("button", { name: "Copy reply" });
    expect(button).not.toHaveTextContent("Copy");
    fireEvent.focus(button);
    expect(await screen.findByRole("tooltip")).toHaveTextContent("Copy reply");
  });
  it("copies the complete Markdown and confirms success", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: { writeText },
    });
    render(<AgentReplyActions text={"**Next game**\n- Saturday"} />);
    fireEvent.click(screen.getByRole("button", { name: "Copy reply" }));
    await waitFor(() => expect(screen.getByText("Copied")).toBeInTheDocument());
    expect(writeText).toHaveBeenCalledWith("**Next game**\n- Saturday");
  });
  it("offers an error toast when clipboard access fails", async () => {
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: { writeText: vi.fn().mockRejectedValue(new Error("Denied")) },
    });
    render(<AgentReplyActions text="Next game" />);
    fireEvent.click(screen.getByRole("button", { name: "Copy reply" }));
    await waitFor(() =>
      expect(mocks.notify).toHaveBeenCalledWith(
        expect.stringContaining("Couldn’t copy")
      )
    );
    expect(screen.queryByText("Copied")).not.toBeInTheDocument();
  });
  it("disables copying while streaming and hides empty replies", () => {
    const { rerender } = render(<AgentReplyActions text="Partial" disabled />);
    expect(screen.getByRole("button", { name: "Copy reply" })).toBeDisabled();
    expect(screen.queryByRole("button", { name: "Good response" })).toBeNull();
    expect(screen.queryByRole("button", { name: "Needs work" })).toBeNull();
    rerender(<AgentReplyActions text="  " />);
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });

  it("collects a reason and saves a rating without sending reply text", async () => {
    const save = vi
      .fn()
      .mockResolvedValue(
        Response.json({ messageId: "reply-id", rating: "bad" })
      );
    globalThis.fetch = save;
    const onRatingSaved = vi.fn();
    render(
      <AgentReplyActions
        text="Private reply text"
        conversationId="chat-id"
        messageId="reply-id"
        onRatingSaved={onRatingSaved}
      />
    );
    fireEvent.click(screen.getByRole("button", { name: "Needs work" }));
    expect(
      screen.getByRole("dialog", { name: "Share reply feedback" })
    ).toBeVisible();
    expect(
      screen.getByRole("link", { name: "Report a problem" })
    ).toHaveAttribute("href", "/feedback?area=agent");
    fireEvent.click(screen.getByRole("button", { name: "Incorrect details" }));
    fireEvent.click(screen.getByRole("button", { name: "Submit feedback" }));
    await waitFor(() =>
      expect(onRatingSaved).toHaveBeenCalledWith("reply-id", "bad")
    );
    const body = JSON.parse(save.mock.calls[0][1].body);
    expect(body).toMatchObject({
      conversationId: "chat-id",
      messageId: "reply-id",
      rating: "bad",
      reasons: ["incorrect"],
      details: "",
    });
    expect(JSON.stringify(body)).not.toContain("Private reply text");
  });

  it("keeps feedback open and explains a failed save", async () => {
    globalThis.fetch = vi
      .fn()
      .mockResolvedValue(
        Response.json(
          { error: "Too many ratings. Try again later." },
          { status: 429 }
        )
      );
    render(
      <AgentReplyActions
        text="Reply"
        conversationId="chat-id"
        messageId="reply-id"
      />
    );
    fireEvent.click(screen.getByRole("button", { name: "Good response" }));
    fireEvent.click(
      screen.getByRole("button", { name: "Answered my question" })
    );
    fireEvent.click(screen.getByRole("button", { name: "Submit feedback" }));
    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Too many ratings. Try again later."
    );
    expect(
      screen.getByRole("dialog", { name: "Share reply feedback" })
    ).toBeVisible();
  });
});

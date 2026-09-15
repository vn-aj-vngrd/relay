import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ notify: vi.fn() }));
vi.mock("@/components/ui/action-notice", () => ({ notify: mocks.notify }));

import { AgentReplyActions } from "./reply-actions";

const originalClipboard = Object.getOwnPropertyDescriptor(
  navigator,
  "clipboard"
);
afterEach(() => {
  if (originalClipboard)
    Object.defineProperty(navigator, "clipboard", originalClipboard);
  else Reflect.deleteProperty(navigator, "clipboard");
  vi.clearAllMocks();
});
describe("Agent reply copy", () => {
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
    rerender(<AgentReplyActions text="  " />);
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });
});

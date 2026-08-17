import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ChatThread } from "./chat-thread";

const scrollTo = vi.fn();

beforeEach(() => {
  scrollTo.mockClear();
  Object.defineProperty(HTMLElement.prototype, "scrollTo", { configurable: true, value: scrollTo });
  Object.defineProperty(window, "matchMedia", { configurable: true, value: vi.fn().mockReturnValue({ matches: false }) });
});

describe("ChatThread", () => {
  it("keeps messages in a scrollable log and follows new messages", () => {
    const { rerender } = render(<ChatThread messageCount={1}><p>First message</p></ChatThread>);
    const log = screen.getByRole("log", { name: "Session messages" });
    expect(log).toHaveClass("chat-thread-scroll", "overflow-y-auto", "flex-1", "min-h-0");
    expect(log).toHaveAttribute("tabindex", "0");
    expect(scrollTo).toHaveBeenCalledWith({ top: 0, behavior: "auto" });

    rerender(<ChatThread messageCount={2}><p>Second message</p></ChatThread>);
    expect(scrollTo).toHaveBeenLastCalledWith({ top: 0, behavior: "smooth" });
  });
});

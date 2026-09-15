import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { AgentDemo } from "./agent-demo";

let intersect: (visible: boolean) => void;
let reduced = false;
beforeEach(() => {
  vi.useFakeTimers();
  reduced = false;
  vi.stubGlobal(
    "matchMedia",
    vi.fn(() => ({
      matches: reduced,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    }))
  );
  vi.stubGlobal(
    "IntersectionObserver",
    class {
      constructor(callback: (entries: { isIntersecting: boolean }[]) => void) {
        intersect = (visible) => callback([{ isIntersecting: visible }]);
      }
      observe() {}
      disconnect() {}
    }
  );
});
afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
});
function enter() {
  act(() => intersect(true));
}
async function finish() {
  for (let index = 0; index < 90; index++)
    await act(async () => {
      vi.advanceTimersByTime(55);
    });
}
describe("Agent landing demo", () => {
  it("matches the chat header and resets to a clean conversation", async () => {
    render(<AgentDemo />);
    enter();
    await finish();
    fireEvent.click(screen.getByRole("button", { name: "New chat" }));
    expect(
      screen.getByRole("button", { name: "Choose sample chat" })
    ).toHaveTextContent("Your chats");
    expect(screen.getByRole("status")).toHaveTextContent("Choose an example");
    fireEvent.click(screen.getByRole("button", { name: "Choose sample chat" }));
    fireEvent.click(
      screen.getByRole("button", { name: "Find courts near me." })
    );
    await finish();
    expect(screen.getByRole("status")).toHaveTextContent(
      "Which city or neighborhood"
    );
  });
  it("starts ready instead of showing a completed answer before entering view", () => {
    render(<AgentDemo />);
    expect(screen.getByRole("status")).toHaveTextContent(
      "Choose an example to see Agent respond."
    );
    expect(
      screen.getByRole("button", { name: "Play demo" })
    ).toBeInTheDocument();
    enter();
    expect(screen.getByRole("status")).toHaveTextContent(
      "Typing an example question."
    );
    expect(screen.getByRole("status")).not.toHaveTextContent(
      "Your next game is Saturday doubles"
    );
  });
  it("plays once, pauses, resumes and finishes with an accessible answer", async () => {
    render(<AgentDemo />);
    enter();
    expect(screen.getByRole("status")).toHaveTextContent(
      "Typing an example question."
    );
    fireEvent.click(screen.getByRole("button", { name: "Pause demo" }));
    await finish();
    expect(screen.getByRole("status")).toHaveTextContent(
      "Typing an example question."
    );
    fireEvent.click(screen.getByRole("button", { name: "Resume demo" }));
    await finish();
    expect(screen.getByRole("status")).toHaveTextContent(
      "Your next game is Saturday doubles"
    );
    act(() => intersect(false));
    enter();
    expect(
      screen.getByRole("button", { name: "Replay demo" })
    ).toBeInTheDocument();
  });
  it("pauses progress offscreen and supports switching the example mid-answer", async () => {
    render(<AgentDemo />);
    enter();
    act(() => intersect(false));
    await finish();
    expect(screen.getByRole("status")).toHaveTextContent(
      "Typing an example question."
    );
    fireEvent.click(screen.getByRole("button", { name: "Open games" }));
    enter();
    await finish();
    expect(screen.getByRole("status")).toHaveTextContent(
      "There are two open games tomorrow"
    );
    expect(screen.getByRole("button", { name: "Open games" })).toHaveAttribute(
      "aria-pressed",
      "true"
    );
  });
  it("pauses typing while the document is hidden", async () => {
    render(<AgentDemo />);
    enter();
    const original = Object.getOwnPropertyDescriptor(document, "hidden");
    try {
      Object.defineProperty(document, "hidden", {
        configurable: true,
        value: true,
      });
      fireEvent(document, new Event("visibilitychange"));
      await finish();
      expect(screen.getByRole("status")).toHaveTextContent(
        "Typing an example question."
      );
      Object.defineProperty(document, "hidden", {
        configurable: true,
        value: false,
      });
      fireEvent(document, new Event("visibilitychange"));
      await finish();
      expect(
        screen.getByRole("button", { name: "Replay demo" })
      ).toBeInTheDocument();
    } finally {
      if (original) Object.defineProperty(document, "hidden", original);
      else Reflect.deleteProperty(document, "hidden");
    }
  });
  it("shows complete answers immediately with reduced motion", () => {
    reduced = true;
    render(<AgentDemo />);
    enter();
    fireEvent.click(screen.getByRole("button", { name: "Who's joining?" }));
    expect(screen.getByRole("status")).toHaveTextContent(
      "Alex, Bea and Marco are going to Saturday doubles"
    );
    expect(
      screen.queryByRole("button", { name: "Pause demo" })
    ).not.toBeInTheDocument();
    expect(vi.getTimerCount()).toBe(0);
  });
});

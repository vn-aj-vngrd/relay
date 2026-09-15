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
  for (let index = 0; index < 50; index++)
    await act(async () => {
      vi.advanceTimersByTime(55);
    });
}
describe("Agent landing demo", () => {
  it("plays once, pauses, resumes and finishes with an accessible answer", async () => {
    render(<AgentDemo />);
    enter();
    expect(screen.getByText("Checking the game details")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Pause demo" }));
    await finish();
    expect(screen.getByText("Checking the game details")).toBeInTheDocument();
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
    expect(screen.getByText("Checking the game details")).toBeInTheDocument();
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
      expect(screen.getByText("Checking the game details")).toBeInTheDocument();
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

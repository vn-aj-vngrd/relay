import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { MarketingEnhancements } from "./marketing-enhancements";

const { lenisScrollTo, lenisDestroy } = vi.hoisted(() => ({
  lenisScrollTo: vi.fn(),
  lenisDestroy: vi.fn(),
}));
vi.mock("lenis", () => ({
  default: class LenisMock {
    scrollTo = lenisScrollTo;
    destroy = lenisDestroy;
  },
}));

class ImmediateObserver {
  constructor(private callback: IntersectionObserverCallback) {}
  observe(target: Element) {
    this.callback(
      [{ isIntersecting: true, target } as IntersectionObserverEntry],
      this as unknown as IntersectionObserver
    );
  }
  unobserve() {}
  disconnect() {}
}

beforeEach(() => {
  Object.defineProperty(window, "matchMedia", {
    configurable: true,
    value: vi.fn().mockReturnValue({
      matches: false,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    }),
  });
  Object.defineProperty(window, "IntersectionObserver", {
    configurable: true,
    value: ImmediateObserver,
  });
  Object.defineProperty(window, "scrollY", {
    configurable: true,
    value: 0,
    writable: true,
  });
  Object.defineProperty(window, "scrollTo", {
    configurable: true,
    value: vi.fn(),
  });
  lenisScrollTo.mockClear();
  lenisDestroy.mockClear();
});

afterEach(() => vi.restoreAllMocks());

describe("MarketingEnhancements", () => {
  it("paints the hero's start state before revealing it, then cleans up", () => {
    vi.spyOn(HTMLElement.prototype, "getBoundingClientRect").mockReturnValue(
      new DOMRect(0, 40, 200, 100)
    );
    const frames: FrameRequestCallback[] = [];
    vi.spyOn(window, "requestAnimationFrame").mockImplementation((callback) =>
      frames.push(callback)
    );
    const cancel = vi
      .spyOn(window, "cancelAnimationFrame")
      .mockImplementation(() => undefined);
    const { unmount } = render(
      <>
        <div data-marketing-reveal="hero">Game scene</div>
        <MarketingEnhancements />
      </>
    );
    const hero = screen.getByText("Game scene");
    expect(hero).toHaveClass("marketing-reveal-ready");
    expect(hero).not.toHaveClass("marketing-reveal-visible");
    act(() => frames.shift()?.(0));
    expect(hero).not.toHaveClass("marketing-reveal-visible");
    act(() => frames.shift()?.(16));
    expect(hero).toHaveClass("marketing-reveal-visible");
    unmount();
    expect(cancel).toHaveBeenCalled();
    expect(lenisDestroy).toHaveBeenCalledOnce();
    expect(hero).not.toHaveClass("marketing-reveal-ready");
  });

  it("observes a long chapter's copy and demo separately and reveals focused content", () => {
    const observed: Element[] = [];
    vi.spyOn(ImmediateObserver.prototype, "observe").mockImplementation(
      (target) => {
        observed.push(target);
      }
    );
    render(
      <>
        <div data-marketing-reveal="sequence">
          <h2>Plan the game</h2>
          <div>
            <a href="/games/new">Create game</a>
          </div>
        </div>
        <MarketingEnhancements />
      </>
    );
    const heading = screen.getByRole("heading", { name: "Plan the game" });
    const link = screen.getByRole("link", { name: "Create game" });
    expect(observed).toContain(heading);
    expect(observed).toContain(link.parentElement);
    expect(observed).not.toContain(heading.parentElement);
    expect(link.parentElement).not.toHaveClass("marketing-reveal-visible");
    fireEvent.focusIn(link);
    expect(link.parentElement).toHaveClass("marketing-reveal-visible");
  });

  it("shows everything without spatial reveals when reduced motion is requested", () => {
    vi.mocked(window.matchMedia).mockReturnValue({
      matches: true,
    } as MediaQueryList);
    render(
      <>
        <section data-marketing-reveal="mask">No motion chapter</section>
        <MarketingEnhancements />
      </>
    );
    expect(screen.getByText("No motion chapter")).not.toHaveClass(
      "marketing-reveal-ready"
    );
    expect(screen.getByText("No motion chapter")).toHaveClass(
      "marketing-reveal-visible"
    );
  });

  it("reveals pending content and stops smooth scrolling when the preference changes", () => {
    let change = () => undefined;
    const preference = {
      matches: false,
      addEventListener: vi.fn((_, callback) => {
        change = callback;
      }),
      removeEventListener: vi.fn(),
    };
    vi.mocked(window.matchMedia).mockReturnValue(
      preference as unknown as MediaQueryList
    );
    vi.spyOn(ImmediateObserver.prototype, "observe").mockImplementation(
      () => undefined
    );
    const { unmount } = render(
      <>
        <section data-marketing-reveal="mask">Pending chapter</section>
        <MarketingEnhancements />
      </>
    );
    const chapter = screen.getByText("Pending chapter");
    expect(chapter).not.toHaveClass("marketing-reveal-visible");
    preference.matches = true;
    act(() => change());
    expect(chapter).toHaveClass("marketing-reveal-visible");
    expect(lenisDestroy).toHaveBeenCalledOnce();
    unmount();
    expect(preference.removeEventListener).toHaveBeenCalledWith(
      "change",
      change
    );
    expect(lenisDestroy).toHaveBeenCalledOnce();
  });

  it("leaves content visible when IntersectionObserver is unavailable", () => {
    Reflect.deleteProperty(window, "IntersectionObserver");
    render(
      <>
        <section data-marketing-reveal="mask">Fallback chapter</section>
        <MarketingEnhancements />
      </>
    );
    expect(screen.getByText("Fallback chapter")).not.toHaveClass(
      "marketing-reveal-ready"
    );
    expect(screen.getByText("Fallback chapter")).toHaveClass(
      "marketing-reveal-visible"
    );
  });
  it("reveals chapters once and provides a smooth return to the top", async () => {
    render(
      <>
        <section data-marketing-reveal>Product chapter</section>
        <MarketingEnhancements />
      </>
    );
    const chapter = screen.getByText("Product chapter");
    expect(chapter).toHaveClass(
      "marketing-reveal-ready",
      "marketing-reveal-visible"
    );

    Object.defineProperty(window, "scrollY", {
      configurable: true,
      value: 1200,
      writable: true,
    });
    fireEvent.scroll(window);
    const top = await screen.findByRole("button", { name: "Back to top" });
    await waitFor(() => expect(top).toHaveClass("is-visible"));
    fireEvent.click(top);
    expect(lenisScrollTo).toHaveBeenCalledWith(0);
  });
});

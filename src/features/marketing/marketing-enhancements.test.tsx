import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { MarketingEnhancements } from "./marketing-enhancements";

const { lenisScrollTo, lenisDestroy } = vi.hoisted(() => ({ lenisScrollTo: vi.fn(), lenisDestroy: vi.fn() }));
vi.mock("lenis", () => ({ default: class LenisMock { scrollTo = lenisScrollTo; destroy = lenisDestroy; } }));

class ImmediateObserver {
  constructor(private callback: IntersectionObserverCallback) {}
  observe(target: Element) { this.callback([{ isIntersecting: true, target } as IntersectionObserverEntry], this as unknown as IntersectionObserver); }
  unobserve() {}
  disconnect() {}
}

beforeEach(() => {
  Object.defineProperty(window, "matchMedia", { configurable: true, value: vi.fn().mockReturnValue({ matches: false }) });
  Object.defineProperty(window, "IntersectionObserver", { configurable: true, value: ImmediateObserver });
  Object.defineProperty(window, "scrollY", { configurable: true, value: 0, writable: true });
  Object.defineProperty(window, "scrollTo", { configurable: true, value: vi.fn() });
  lenisScrollTo.mockClear();
  lenisDestroy.mockClear();
});

describe("MarketingEnhancements", () => {
  it("reveals chapters once and provides a smooth return to the top", async () => {
    render(<><section data-marketing-reveal>Product chapter</section><MarketingEnhancements /></>);
    const chapter = screen.getByText("Product chapter");
    expect(chapter).toHaveClass("marketing-reveal-ready", "marketing-reveal-visible");

    Object.defineProperty(window, "scrollY", { configurable: true, value: 1200, writable: true });
    fireEvent.scroll(window);
    const top = await screen.findByRole("button", { name: "Back to top" });
    await waitFor(() => expect(top).toHaveClass("is-visible"));
    fireEvent.click(top);
    expect(lenisScrollTo).toHaveBeenCalledWith(0);
  });
});

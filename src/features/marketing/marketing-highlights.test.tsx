import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { MarketingHighlights } from "./marketing-highlights";

beforeEach(() => {
  Object.defineProperty(HTMLElement.prototype, "scrollWidth", {
    configurable: true,
    get: () => 1200,
  });
  Object.defineProperty(HTMLElement.prototype, "clientWidth", {
    configurable: true,
    get: () => 400,
  });
  Object.defineProperty(HTMLElement.prototype, "scrollTo", {
    configurable: true,
    value: vi.fn(),
  });
  Object.defineProperty(window, "matchMedia", {
    configurable: true,
    value: vi.fn(() => ({ matches: false })),
  });
});

describe("MarketingHighlights", () => {
  it("summarizes the full session lifecycle in a manual carousel", () => {
    render(<MarketingHighlights />);

    const cards = Array.from(
      screen.getByRole("list", { name: "Relay product highlights" }).children
    );
    expect(cards).toHaveLength(8);
    expect(cards[0]).toHaveTextContent("Find");
    expect(cards[4]).toHaveTextContent("Play");
    expect(cards[5]).toHaveTextContent("Repay");
    expect(
      screen.getByRole("button", { name: "Previous highlight" })
    ).toBeDisabled();
    expect(screen.getByText(/01 \/ 08/)).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Next highlight" }));
    expect(screen.getByText(/02 \/ 08/)).toBeInTheDocument();

    fireEvent.keyDown(
      screen.getByRole("list", { name: "Relay product highlights" }),
      { key: "ArrowRight" }
    );
    expect(screen.getByText(/03 \/ 08/)).toBeInTheDocument();
  });

  it("stops navigation when the final card is already visible", () => {
    render(<MarketingHighlights />);
    const rail = screen.getByRole("list", { name: "Relay product highlights" });
    Object.defineProperty(rail, "scrollLeft", {
      configurable: true,
      value: 800,
      writable: true,
    });

    fireEvent.scroll(rail);

    expect(
      screen.getByRole("button", { name: "Next highlight" })
    ).toBeDisabled();
    expect(
      screen.getByRole("button", { name: "Previous highlight" })
    ).toBeEnabled();
  });
});

import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { MarketingHighlights } from "./marketing-highlights";

beforeEach(() => {
  Object.defineProperty(HTMLElement.prototype, "scrollTo", { configurable: true, value: vi.fn() });
  Object.defineProperty(window, "matchMedia", {
    configurable: true,
    value: vi.fn(() => ({ matches: false })),
  });
});

describe("MarketingHighlights", () => {
  it("summarizes the full session lifecycle in a manual carousel", () => {
    render(<MarketingHighlights />);

    const cards = Array.from(screen.getByRole("list", { name: "Relay product highlights" }).children);
    expect(cards).toHaveLength(7);
    expect(cards[3]).toHaveTextContent("Play");
    expect(cards[4]).toHaveTextContent("Repay");
    expect(screen.getByRole("button", { name: "Previous highlight" })).toBeDisabled();
    expect(screen.getByText(/01 \/ 07/)).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Next highlight" }));
    expect(screen.getByText(/02 \/ 07/)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Previous highlight" })).toBeEnabled();

    fireEvent.keyDown(screen.getByRole("list", { name: "Relay product highlights" }), { key: "ArrowRight" });
    expect(screen.getByText(/03 \/ 07/)).toBeInTheDocument();
  });
});

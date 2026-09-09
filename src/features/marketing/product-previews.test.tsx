import { act, render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { HeroProductShot } from "./hero-product-shot";

describe("HeroProductShot", () => {
  it("shows the whole game lifecycle together without slide navigation", () => {
    const { container } = render(<HeroProductShot />);
    expect(
      screen.getByRole("figure", { name: "One game, from invite to recap" })
    ).toBeVisible();
    expect(
      screen.getByRole("heading", { name: "Saturday Night Pickle" })
    ).toBeVisible();
    for (const name of [
      "Invites, roster and chat",
      "Live scores and rotation",
      "Payment tracking",
      "Shareable game stories",
    ]) {
      expect(screen.getByRole("region", { name })).toBeVisible();
    }
    expect(
      container.querySelector('[aria-roledescription="carousel"]')
    ).toBeNull();
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
    expect(screen.queryByRole("tab")).not.toBeInTheDocument();
    // React may insert hidden bookkeeping spans; only product panels must stay visible.
    expect(
      container.querySelector("form, [inert], [data-marketing-part][hidden]")
    ).toBeNull();
  });

  it("demonstrates truthful RSVP, queue and external-payment behavior", () => {
    render(<HeroProductShot />);
    expect(
      screen.getByText("Guests can RSVP. No account needed.")
    ).toBeVisible();
    expect(screen.getByText("8 of 10 going")).toBeVisible();
    const court = screen.getByRole("region", {
      name: "Live scores and rotation",
    });
    expect(within(court).getByText("Van + AJ")).toBeVisible();
    expect(within(court).getByText("8")).toBeVisible();
    expect(within(court).getByText("6")).toBeVisible();
    expect(within(court).getByText(/Kara \+ Luis/)).toBeVisible();
    expect(within(court).getByText(/John \+ Sam/)).toBeVisible();
    expect(screen.getByText("Proof sent")).toBeVisible();
    expect(screen.getByText("Confirmed")).toBeVisible();
    expect(
      screen.getByText("Pay the host your usual way. Track it here.")
    ).toBeVisible();
    expect(screen.getByText(/Illustrative game/)).toBeVisible();
  });

  it("keeps all features in place over time rather than advancing automatically", () => {
    vi.useFakeTimers();
    try {
      const { container } = render(<HeroProductShot />);
      const initial = container.innerHTML;
      act(() => vi.advanceTimersByTime(30000));
      expect(container.innerHTML).toBe(initial);
      expect(
        screen.getByRole("region", { name: "Shareable game stories" })
      ).toBeVisible();
    } finally {
      vi.useRealTimers();
    }
  });
});

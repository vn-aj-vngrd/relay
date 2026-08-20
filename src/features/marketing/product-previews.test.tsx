import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/features/sessions/actions", () => ({ createSessionAction: vi.fn(), rsvpAction: vi.fn() }));
vi.mock("@/features/matches/actions", () => ({ finishMatch: vi.fn(), saveScore: vi.fn(), startPlay: vi.fn() }));
vi.mock("@/features/payments/actions", () => ({ markPaymentSent: vi.fn() }));
vi.mock("@/features/chat/actions", () => ({ sendMessage: vi.fn() }));
vi.mock("@/features/analytics/actions", () => ({ trackSharedSessionEvent: vi.fn() }));

import { HeroProductShot } from "./product-previews";

describe("HeroProductShot", () => {
  it("renders the current responsive product structure instead of a stale screenshot", () => {
    const { container } = render(<HeroProductShot />);

    expect(screen.getByRole("heading", { name: "Saturday Night Pickle" })).toBeVisible();
    expect(screen.getByText("Story")).toBeVisible();
    expect(screen.getByRole("heading", { name: "At a glance" })).toBeVisible();
    expect(screen.getByText("The real Relay Overview components")).toBeVisible();
    expect(container.querySelector('img[src="/images/product/overview.webp"]')).not.toBeInTheDocument();
  });
});

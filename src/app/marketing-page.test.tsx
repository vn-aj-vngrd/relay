import { cleanup, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ getCurrentUser: vi.fn() }));

vi.mock("@/features/auth/session", () => ({
  getCurrentUser: mocks.getCurrentUser,
}));
vi.mock("@/components/shared/brand", () => ({
  Brand: () => <span>Relay</span>,
  RelayMark: () => <span>Relay mark</span>,
}));
vi.mock("@/features/marketing/court-finder-showcase", () => ({
  CourtFinderShowcase: () => null,
}));
vi.mock("@/features/marketing/marketing-courts", () => ({
  marketingCourts: [],
}));
vi.mock("@/features/marketing/marketing-enhancements", () => ({
  MarketingEnhancements: () => null,
}));
vi.mock("@/features/marketing/marketing-highlights", () => ({
  MarketingHighlights: () => null,
}));
vi.mock("@/features/marketing/marketing-section-nav", () => ({
  MarketingSectionNav: () => null,
}));
vi.mock("@/features/marketing/product-previews", () => ({
  ChatProductPreview: () => null,
  CreateProductPreview: () => null,
  HeroProductShot: () => null,
  InviteProductShot: () => null,
  LivePlayProductPreview: () => null,
  PaymentsProductPreview: () => null,
  PlaySetupProductPreview: () => null,
}));
vi.mock("@/features/marketing/recap-template-preview", () => ({
  RecapTemplatePreview: () => null,
}));

import MarketingPage from "./(marketing)/page";

afterEach(() => {
  cleanup();
  mocks.getCurrentUser.mockReset();
});

describe("marketing account actions", () => {
  it("exposes login and signup without replacing public game planning", async () => {
    mocks.getCurrentUser.mockResolvedValue(null);

    render(await MarketingPage());

    const header = within(screen.getByRole("banner"));
    const login = header.getByRole("link", { name: "Log in" });
    expect(login).toHaveAttribute("href", "/login");
    expect(login).toHaveClass("inline-flex", "min-h-11");
    expect(login).not.toHaveClass("hidden");
    expect(header.getByRole("link", { name: "Sign up" })).toHaveAttribute(
      "href",
      "/signup"
    );
    expect(
      header.queryByRole("link", { name: "Get started" })
    ).not.toBeInTheDocument();
    expect(
      screen.getAllByRole("link", { name: "Create a game" })[0]
    ).toHaveAttribute("href", "/games/new");
  });

  it("replaces authentication prompts with one app action when signed in", async () => {
    mocks.getCurrentUser.mockResolvedValue({ id: "player-1" });

    render(await MarketingPage());

    const header = within(screen.getByRole("banner"));
    expect(header.getByRole("link", { name: "Open app" })).toHaveAttribute(
      "href",
      "/home"
    );
    expect(
      screen.queryByRole("link", { name: "Log in" })
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("link", { name: "Get started" })
    ).not.toBeInTheDocument();
    expect(
      header.queryByRole("link", { name: "Sign up" })
    ).not.toBeInTheDocument();
    expect(screen.getAllByRole("link", { name: "Open app" })).toHaveLength(2);
  });
});

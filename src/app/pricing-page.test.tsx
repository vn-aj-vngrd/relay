import { render, screen, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ getCurrentUser: vi.fn() }));
vi.mock("@/features/auth/session", () => ({
  getCurrentUser: mocks.getCurrentUser,
}));

vi.mock("next/server", () => ({ connection: async () => undefined }));
vi.mock("@/components/shared/brand", () => ({
  Brand: () => <span>Relay</span>,
}));
vi.mock("@/features/billing/catalog", async () => {
  const { defaultBillingPlans } = await import("@/features/billing/domain");
  return {
    getBillingOffer: async () => ({
      catalog: defaultBillingPlans,
      acceptingPayments: false,
    }),
  };
});

import PricingPage, { metadata } from "./(marketing)/pricing/page";

beforeEach(() => {
  mocks.getCurrentUser.mockReset();
  mocks.getCurrentUser.mockResolvedValue(null);
});

describe("dedicated public pricing page", () => {
  it("hides billing navigation from signed-out visitors", async () => {
    render(await PricingPage());
    expect(
      screen.queryByRole("link", { name: "Plan & billing" })
    ).not.toBeInTheDocument();
    const header = within(screen.getByRole("banner"));
    expect(header.getByRole("link", { name: "Log in" })).toHaveAttribute(
      "href",
      "/login"
    );
    expect(header.getByRole("link", { name: "Sign up" })).toHaveAttribute(
      "href",
      "/signup"
    );
    expect(
      header.queryByRole("link", { name: "Open app" })
    ).not.toBeInTheDocument();
    expect(
      header.queryByRole("link", { name: "Overview" })
    ).not.toBeInTheDocument();
    expect(
      header.queryByRole("link", { name: "Pricing" })
    ).not.toBeInTheDocument();
  });

  it("shows billing navigation in the header and footer when signed in", async () => {
    mocks.getCurrentUser.mockResolvedValue({ id: "account-1" });
    render(await PricingPage());
    const header = within(screen.getByRole("banner"));
    expect(header.getByRole("link", { name: "Open app" })).toHaveAttribute(
      "href",
      "/home"
    );
    expect(
      header.queryByRole("link", { name: "Log in" })
    ).not.toBeInTheDocument();
    expect(
      header.queryByRole("link", { name: "Sign up" })
    ).not.toBeInTheDocument();
    expect(
      header.queryByRole("link", { name: "Overview" })
    ).not.toBeInTheDocument();
    expect(
      header.queryByRole("link", { name: "Pricing" })
    ).not.toBeInTheDocument();
    for (const label of ["Pricing navigation", "Footer"]) {
      const navigation = within(
        screen.getByRole("navigation", { name: label })
      );
      expect(
        navigation.getByRole("link", { name: "Plan & billing" })
      ).toHaveAttribute("href", "/settings/plan");
    }
  });
  it("places three plan cards before a detailed comparison and FAQs", async () => {
    render(await PricingPage());
    const main = within(screen.getByRole("main"));
    const cards = main.getAllByRole("article");
    expect(cards).toHaveLength(3);
    const table = main.getByRole("table");
    expect(
      cards[2].compareDocumentPosition(table) & Node.DOCUMENT_POSITION_FOLLOWING
    ).not.toBe(0);
    expect(main.getByText("5 games per month")).toBeInTheDocument();
    expect(main.getByText("12 games per month")).toBeInTheDocument();
    expect(main.getByText("30 games per month")).toBeInTheDocument();
    expect(
      main.getByRole("heading", { name: "How plans work" })
    ).toBeInTheDocument();
    expect(metadata.alternates).toEqual({ canonical: "/pricing" });
  });
});

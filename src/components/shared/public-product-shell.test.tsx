import {
  cleanup,
  fireEvent,
  render,
  screen,
  within,
} from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("next/navigation", () => ({ usePathname: () => "/games/open" }));

import { PublicProductShell } from "./public-product-shell";

afterEach(cleanup);

describe("PublicProductShell", () => {
  it("places one desktop Help link above account access, outside Try Relay", () => {
    render(<PublicProductShell>Public content</PublicProductShell>);
    const sidebar = screen.getByRole("complementary");
    const help = within(sidebar).getByRole("link", { name: "Help Center" });
    const support = within(sidebar).getByRole("navigation", {
      name: "Public support",
    });
    const primary = within(sidebar).getByRole("navigation", {
      name: "Explore Relay",
    });
    const prompt = within(sidebar).getByText(
      "Sign in to save games, invite players, and keep scores."
    );
    expect(support).toContainElement(help);
    expect(
      within(primary).queryByRole("link", { name: "Help Center" })
    ).not.toBeInTheDocument();
    expect(
      help.compareDocumentPosition(prompt) & Node.DOCUMENT_POSITION_FOLLOWING
    ).toBeTruthy();
    expect(support.parentElement).toHaveClass("mt-auto");
  });
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.removeAttribute("data-sidebar");
  });

  it("offers the persistent desktop sidebar collapse control", () => {
    render(<PublicProductShell>Public content</PublicProductShell>);

    expect(screen.getByRole("complementary")).toHaveClass("overflow-y-auto");

    fireEvent.click(screen.getByRole("button", { name: "Close sidebar" }));

    expect(document.documentElement).toHaveAttribute("data-sidebar", "compact");
    expect(localStorage.getItem("relay-sidebar")).toBe("compact");
    expect(
      screen.getByRole("button", { name: "Open sidebar" })
    ).toHaveAttribute("aria-expanded", "false");

    const accountAccess = screen.getByRole("navigation", {
      name: "Account access",
    });
    expect(accountAccess).toContainElement(
      screen.getByRole("link", { name: "Log in to Relay" })
    );
    expect(accountAccess).toContainElement(
      screen.getByRole("link", { name: "Create a Relay account" })
    );
  });
});

import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { PublicProductNav } from "./public-product-nav";

const mocks = vi.hoisted(() => ({ pathname: "/play" }));
vi.mock("next/navigation", () => ({ usePathname: () => mocks.pathname }));
beforeEach(() => {
  mocks.pathname = "/play";
});
afterEach(cleanup);

describe("PublicProductNav", () => {
  it.each(["sidebar-support", "mobile"] as const)(
    "keeps Help active on article routes in %s navigation",
    (mode) => {
      mocks.pathname = "/help/guest-rsvp";
      render(<PublicProductNav mode={mode} />);
      expect(screen.getByRole("link", { name: "Help Center" })).toHaveAttribute(
        "href",
        "/help"
      );
      expect(screen.getByRole("link", { name: "Help Center" })).toHaveAttribute(
        "aria-current",
        "page"
      );
      if (mode === "mobile")
        expect(
          screen.getByRole("link", { name: "Find courts" })
        ).not.toHaveAttribute("aria-current");
    }
  );

  it("exposes Relay's useful public entry points", () => {
    render(<PublicProductNav mode="sidebar" />);

    expect(screen.getByRole("link", { name: "Plan a game" })).toHaveAttribute(
      "href",
      "/games/new"
    );
    expect(screen.getByRole("link", { name: "Find courts" })).toHaveAttribute(
      "href",
      "/courts"
    );
    expect(screen.getByRole("link", { name: "Quick Play" })).toHaveAttribute(
      "aria-current",
      "page"
    );
    expect(screen.getByRole("link", { name: "Open games" })).toHaveAttribute(
      "href",
      "/games/open"
    );
  });
});

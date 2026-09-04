import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { PublicProductNav } from "./public-product-nav";

vi.mock("next/navigation", () => ({ usePathname: () => "/play" }));

describe("PublicProductNav", () => {
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

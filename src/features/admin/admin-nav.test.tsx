import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("next/navigation", () => ({ usePathname: () => "/admin/courts" }));

import { AdminNav } from "./admin-nav";

describe("AdminNav", () => {
  it("uses Courts as the canonical admin directory label", () => {
    render(<AdminNav mode="sidebar" />);
    expect(screen.getByRole("link", { name: "Courts" })).toHaveAttribute(
      "href",
      "/admin/courts"
    );
    expect(screen.getByRole("link", { name: "Insights" })).toHaveAttribute(
      "href",
      "/admin/insights"
    );
    expect(
      screen.queryByRole("link", { name: "Venues" })
    ).not.toBeInTheDocument();
  });
});

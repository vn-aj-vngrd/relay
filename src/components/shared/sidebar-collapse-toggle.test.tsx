import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";

import { SidebarCollapseToggle } from "./sidebar-collapse-toggle";

describe("SidebarCollapseToggle", () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.removeAttribute("data-sidebar");
  });

  it("collapses and restores the desktop sidebar persistently", () => {
    render(<SidebarCollapseToggle />);

    const close = screen.getByRole("button", { name: "Close sidebar" });
    expect(close).toHaveAttribute("aria-expanded", "true");
    fireEvent.click(close);

    expect(document.documentElement).toHaveAttribute("data-sidebar", "compact");
    expect(localStorage.getItem("relay-sidebar")).toBe("compact");

    fireEvent.click(screen.getByRole("button", { name: "Open sidebar" }));
    expect(document.documentElement).not.toHaveAttribute("data-sidebar");
    expect(localStorage.getItem("relay-sidebar")).toBe("expanded");
  });
});

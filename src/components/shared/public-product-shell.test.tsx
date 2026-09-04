import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("next/navigation", () => ({ usePathname: () => "/games/open" }));

import { PublicProductShell } from "./public-product-shell";

describe("PublicProductShell", () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.removeAttribute("data-sidebar");
  });

  it("offers the persistent desktop sidebar collapse control", () => {
    render(<PublicProductShell>Public content</PublicProductShell>);

    fireEvent.click(screen.getByRole("button", { name: "Close sidebar" }));

    expect(document.documentElement).toHaveAttribute("data-sidebar", "compact");
    expect(localStorage.getItem("relay-sidebar")).toBe("compact");
    expect(
      screen.getByRole("button", { name: "Open sidebar" })
    ).toHaveAttribute("aria-expanded", "false");
  });
});

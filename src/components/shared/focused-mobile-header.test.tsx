import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { FocusedMobileHeader } from "./focused-mobile-header";

afterEach(cleanup);

describe("FocusedMobileHeader", () => {
  it.each([
    { isAuthenticated: true, label: "Back to Home", href: "/home" },
    { isAuthenticated: false, label: "Back to Relay", href: "/" },
  ])("routes $label to $href", ({ isAuthenticated, label, href }) => {
    render(
      <FocusedMobileHeader
        title="Quick Play"
        isAuthenticated={isAuthenticated}
      />
    );

    expect(screen.getByText("Quick Play")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: label })).toHaveAttribute(
      "href",
      href
    );
  });
});

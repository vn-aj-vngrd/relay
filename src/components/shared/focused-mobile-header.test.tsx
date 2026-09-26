import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { FocusedMobileHeader } from "./focused-mobile-header";

afterEach(cleanup);

describe("FocusedMobileHeader", () => {
  it("supports a profile back link and page heading", () => {
    render(
      <FocusedMobileHeader
        title="Your game insights"
        isAuthenticated
        backHref="/profile/my-profile"
        backLabel="Back to profile"
        heading
      />
    );

    expect(
      screen.getByRole("heading", { name: "Your game insights" })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "Back to profile" })
    ).toHaveAttribute("href", "/profile/my-profile");
  });

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
    expect(screen.getByRole("link", { name: label })).toHaveClass(
      "back-control",
      "size-11"
    );
    expect(screen.getByRole("link", { name: label })).toHaveAttribute(
      "href",
      href
    );
  });
});

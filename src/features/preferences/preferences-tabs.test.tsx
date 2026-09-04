import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { PreferencesTabs } from "./preferences-tabs";

afterEach(cleanup);

describe("PreferencesTabs", () => {
  it("links to URL-backed preference sections and marks the active one", () => {
    render(<PreferencesTabs active="notifications" />);

    expect(
      screen.getByRole("navigation", { name: "Preference sections" })
    ).toBeVisible();
    expect(screen.getAllByRole("link").map((link) => link.textContent)).toEqual(
      ["Account", "Notifications", "Games", "Appearance"]
    );
    expect(screen.getByRole("link", { name: "Appearance" })).toHaveAttribute(
      "href",
      "/preferences?section=appearance"
    );
    expect(screen.getByRole("link", { name: "Games" })).toHaveAttribute(
      "href",
      "/preferences?section=games"
    );
    expect(screen.getByRole("link", { name: "Notifications" })).toHaveAttribute(
      "href",
      "/preferences?section=notifications"
    );
    expect(screen.getByRole("link", { name: "Account" })).toHaveAttribute(
      "href",
      "/preferences"
    );
    expect(screen.getByRole("link", { name: "Notifications" })).toHaveAttribute(
      "aria-current",
      "page"
    );
  });
});

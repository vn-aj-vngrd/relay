import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { SettingsTabs } from "./settings-tabs";

afterEach(cleanup);

describe("SettingsTabs", () => {
  it("links to URL-backed settings sections and marks the active one", () => {
    render(<SettingsTabs active="notifications" />);

    expect(
      screen.getByRole("navigation", { name: "Settings sections" })
    ).toBeVisible();
    expect(screen.getAllByRole("link").map((link) => link.textContent)).toEqual(
      ["Account", "Notifications", "Games", "Appearance"]
    );
    expect(screen.getByRole("link", { name: "Appearance" })).toHaveAttribute(
      "href",
      "/settings?section=appearance"
    );
    expect(screen.getByRole("link", { name: "Games" })).toHaveAttribute(
      "href",
      "/settings?section=games"
    );
    expect(screen.getByRole("link", { name: "Notifications" })).toHaveAttribute(
      "href",
      "/settings?section=notifications"
    );
    expect(screen.getByRole("link", { name: "Account" })).toHaveAttribute(
      "href",
      "/settings"
    );
    expect(screen.getByRole("link", { name: "Notifications" })).toHaveAttribute(
      "aria-current",
      "page"
    );
  });
});

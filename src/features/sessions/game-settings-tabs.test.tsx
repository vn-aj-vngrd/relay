import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { GameSettingsTabs } from "./game-settings-tabs";

afterEach(cleanup);

describe("GameSettingsTabs", () => {
  it("links to URL-backed settings sections and marks the active one", () => {
    render(<GameSettingsTabs sessionId="session-1" active="booking" />);

    expect(
      screen.getByRole("navigation", { name: "Game settings sections" })
    ).toBeVisible();
    expect(screen.getByRole("link", { name: "Plan" })).toHaveAttribute(
      "href",
      "/games/session-1/settings"
    );
    expect(screen.getByRole("link", { name: "Invite" })).toHaveAttribute(
      "href",
      "/games/session-1/settings?section=invite"
    );
    expect(screen.getByRole("link", { name: "Booking" })).toHaveAttribute(
      "href",
      "/games/session-1/settings?section=booking"
    );
    expect(screen.getByRole("link", { name: "Organizers" })).toHaveAttribute(
      "href",
      "/games/session-1/settings?section=organizers"
    );
    expect(screen.getByRole("link", { name: "Booking" })).toHaveAttribute(
      "aria-current",
      "page"
    );
  });
});

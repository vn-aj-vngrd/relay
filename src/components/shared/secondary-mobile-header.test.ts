import { describe, expect, it } from "vitest";

import { secondaryMobileRoute } from "./secondary-mobile-header";

describe("secondary mobile routes", () => {
  const username = "alex-player";

  it.each([
    ["/search", "Search", "/home"],
    ["/notifications", "Notifications", "/home"],
    ["/profile/alex-player", "Profile", "/home"],
    ["/profile/alex-player/edit", "Edit profile", "/profile/alex-player"],
    ["/settings", "Settings", "/profile/alex-player"],
    ["/settings/password", "Change password", "/settings"],
    ["/settings/plan", "Plan & billing", "/settings"],
    ["/feedback", "Send feedback", "/profile/alex-player"],
    ["/courts", "Courts", "/home"],
    ["/courts/cebu-court", "Court", "/courts"],
    ["/help", "Help Center", "/profile/alex-player"],
  ])("gives %s a focused title and return route", (path, title, backHref) => {
    expect(secondaryMobileRoute(path, username)).toMatchObject({
      title,
      backHref,
    });
  });

  it.each([
    "/home",
    "/games",
    "/games/invitations",
    "/groups",
    "/groups/a-crew",
    "/agent",
    "/profile/alex-player/insights",
  ])("keeps %s on its existing mobile layout", (path) => {
    expect(secondaryMobileRoute(path, username)).toBeNull();
  });

  it("keeps the player's name as the profile page heading", () => {
    expect(
      secondaryMobileRoute("/profile/alex-player", username)
    ).toMatchObject({
      heading: false,
    });
  });
});

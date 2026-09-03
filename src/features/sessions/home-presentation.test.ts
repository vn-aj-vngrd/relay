import { describe, expect, it } from "vitest";

import {
  homeHeading,
  homeParticipationLabel,
  homePendingRequestLabel,
  visibleHomePendingCount,
} from "./home-presentation";

describe("home presentation", () => {
  it("describes live, confirmed, tentative, and empty schedules truthfully", () => {
    expect(homeHeading({ live: true, hasPrimary: true, hasTentative: true })).toBe("Your game is live.");
    expect(homeHeading({ live: false, hasPrimary: true, hasTentative: true })).toBe("Your next game is set.");
    expect(homeHeading({ live: false, hasPrimary: false, hasTentative: true })).toBe("Your plans are taking shape.");
    expect(homeHeading({ live: false, hasPrimary: false, hasTentative: false })).toBe("Ready for your next game?");
  });

  it("makes tentative, host, and co-host participation explicit", () => {
    expect(homeParticipationLabel("going", "host")).toBe("Hosting");
    expect(homeParticipationLabel("going", "cohost")).toBe("Co-hosting");
    expect(homeParticipationLabel("going", "player")).toBe("Going");
    expect(homeParticipationLabel("maybe", "player")).toBe("Maybe");
    expect(homeParticipationLabel("pending", "player")).toBe("Awaiting approval");
    expect(homeParticipationLabel("waitlisted", "player")).toBe("Waitlisted");
  });

  it("shows pending approvals only to hosts and co-hosts", () => {
    expect(visibleHomePendingCount(3, "host", true)).toBe(3);
    expect(visibleHomePendingCount(3, "cohost", false)).toBe(3);
    expect(visibleHomePendingCount(3, "player", false)).toBe(0);
  });

  it("pluralizes pending approval counts", () => {
    expect(homePendingRequestLabel(1)).toBe("1 request waiting");
    expect(homePendingRequestLabel(3)).toBe("3 requests waiting");
  });
});

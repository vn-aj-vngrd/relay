import { describe, expect, it } from "vitest";

import { homeHeading, homeParticipationLabel } from "./home-presentation";

describe("home presentation", () => {
  it("describes live, confirmed, tentative, and empty schedules truthfully", () => {
    expect(homeHeading({ live: true, hasPrimary: true, hasTentative: true })).toBe("Your game is live.");
    expect(homeHeading({ live: false, hasPrimary: true, hasTentative: true })).toBe("Your next game is set.");
    expect(homeHeading({ live: false, hasPrimary: false, hasTentative: true })).toBe("Your plans are taking shape.");
    expect(homeHeading({ live: false, hasPrimary: false, hasTentative: false })).toBe("Ready for your next game?");
  });

  it("makes tentative and host participation explicit", () => {
    expect(homeParticipationLabel("going", true)).toBe("Hosting");
    expect(homeParticipationLabel("going", false)).toBe("Going");
    expect(homeParticipationLabel("maybe", false)).toBe("Maybe");
    expect(homeParticipationLabel("pending", false)).toBe("Awaiting approval");
    expect(homeParticipationLabel("waitlisted", false)).toBe("Waitlisted");
  });
});

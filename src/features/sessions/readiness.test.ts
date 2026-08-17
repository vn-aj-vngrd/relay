import { describe, expect, it } from "vitest";
import { sessionReadiness } from "./readiness";

describe("sessionReadiness", () => {
  it("identifies the host's next useful setup tasks", () => {
    expect(sessionReadiness({ goingCount: 3, booked: false, expectsCollection: true, collectionCreated: false })).toMatchObject({ percent: 0, ready: false, missing: ["roster", "booking", "payment"] });
  });

  it("does not require payment setup when there is no shared cost", () => {
    expect(sessionReadiness({ goingCount: 4, booked: true, expectsCollection: false, collectionCreated: false })).toMatchObject({ percent: 100, ready: true, missing: [] });
  });

  it("reports partial progress without claiming the game is ready", () => {
    expect(sessionReadiness({ goingCount: 8, booked: false, expectsCollection: true, collectionCreated: true })).toMatchObject({ percent: 67, ready: false, completed: 2, total: 3 });
  });
});

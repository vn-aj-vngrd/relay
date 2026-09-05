import { describe, expect, it } from "vitest";

import {
  eligiblePlayPlayers,
  playSetupNextAction,
  sessionReadiness,
} from "./readiness";

const base = { goingCount: 4, booked: false, bookingNotRequired: false };

describe("sessionReadiness", () => {
  it("requires the court arrangement, not a payment decision", () => {
    expect(sessionReadiness(base).missing).toEqual(["booking"]);
    expect(playSetupNextAction(sessionReadiness(base))).toBe(
      "Confirm court arrangement"
    );
  });
  it.each([null, 0, 5000])(
    "does not block Play for player price %s",
    (playerPriceCents) => {
      const session = {
        ...base,
        booked: true,
        playerPriceCents,
        collectionCreated: false,
      };
      expect(sessionReadiness(session).ready).toBe(true);
      expect(playSetupNextAction(sessionReadiness(session))).toBe(
        "Set up Play"
      );
    }
  );
  it("accepts no booking needed without a repayment split", () => {
    expect(sessionReadiness({ ...base, bookingNotRequired: true }).ready).toBe(
      true
    );
  });
  it("still requires four eligible players", () => {
    expect(
      sessionReadiness({ ...base, goingCount: 3, booked: true }).missing
    ).toEqual(["roster"]);
  });
});

describe("eligiblePlayPlayers", () => {
  const players = Array.from({ length: 4 }, (_, id) => ({
    id,
    checkedInAt: null as Date | null,
    playState: "waiting",
  }));
  it("includes everyone going until attendance is taken", () => {
    expect(eligiblePlayPlayers(players)).toHaveLength(4);
  });
  it("only includes checked-in players once arrival is explicit", () => {
    expect(
      eligiblePlayPlayers(
        players.map((player) =>
          player.id === 0 ? { ...player, checkedInAt: new Date() } : player
        )
      )
    ).toHaveLength(1);
  });
  it("does not include absent players when nobody is here", () => {
    expect(
      eligiblePlayPlayers(
        players.map((player) => ({ ...player, playState: "unavailable" }))
      )
    ).toEqual([]);
  });
});

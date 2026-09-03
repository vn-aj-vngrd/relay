import { describe, expect, it } from "vitest";

import { planPlayAvailability, splitFinishedPlayers } from "./availability";

describe("play availability", () => {
  it("moves a returning player to the end of the waiting queue", () => {
    expect(planPlayAvailability({ intent: "ready", queueState: "resting", maxQueuePosition: 8 })).toEqual({
      playerState: "waiting",
      queueState: "waiting",
      queuePosition: 9,
      deferred: false,
    });
  });

  it("defers an active player’s break until their match finishes", () => {
    expect(planPlayAvailability({ intent: "sit_out", queueState: "playing", maxQueuePosition: 8 })).toEqual({
      playerState: "resting",
      queueState: null,
      queuePosition: null,
      deferred: true,
    });
  });

  it("removes a waiting player from rotation immediately", () => {
    expect(planPlayAvailability({ intent: "sit_out", queueState: "waiting", maxQueuePosition: 8 })).toEqual({
      playerState: "resting",
      queueState: "resting",
      queuePosition: null,
      deferred: false,
    });
  });

  it("keeps deferred players out when their active match finishes", () => {
    expect(splitFinishedPlayers(["ready", "injured", "ready-two"], new Set(["injured"]))).toEqual({
      waitingPlayerIds: ["ready", "ready-two"],
      restingPlayerIds: ["injured"],
    });
  });
});

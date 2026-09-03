import { describe, expect, it } from "vitest";

import { postGameContinuation } from "./post-game";

const session = {
  id: "59c6fa3f-3f6f-45f2-bbea-b85bc90aa3a7",
  hostId: "host",
  groupId: null,
  status: "completed",
};

describe("postGameContinuation", () => {
  it("offers the original host replay and save-crew routes", () => {
    expect(postGameContinuation(session, "host")).toEqual({
      replayHref: `/games/new?from=${session.id}`,
      saveCrewHref: `/groups/new?from=${session.id}`,
    });
  });

  it("does not offer host actions to participants or before completion", () => {
    expect(postGameContinuation(session, "player")).toBeUndefined();
    expect(postGameContinuation({ ...session, status: "live" }, "host")).toBeUndefined();
  });

  it("does not offer Save this crew when the game already belongs to a group", () => {
    expect(postGameContinuation({ ...session, groupId: "group" }, "host")).toEqual({
      replayHref: `/games/new?from=${session.id}`,
    });
  });
});

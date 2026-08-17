import { describe, expect, it } from "vitest";
import { parsePlaySetup, planRotation, rotationDescription } from "./rotation";

const courts = [
  { id: "court-1", label: "Court 1", position: 1 },
  { id: "court-2", label: "Court 2", position: 2 },
];
const waiting = (ids: string[]) => ids.map((id, index) => ({ id, position: index + 1 }));

describe("play rotation", () => {
  it("validates the host setup and keeps queue rules scoped to Paddle Stack", () => {
    expect(parsePlaySetup({ mode: "queue", queueRule: "adaptive" })).toEqual({ mode: "queue", queueRule: "adaptive" });
    expect(parsePlaySetup({ mode: "random", queueRule: "winner_stays" })).toEqual({ mode: "random" });
    expect(() => parsePlaySetup({ mode: "manual" })).toThrow();
  });

  it("starts one continuous Paddle Stack match from queue order", () => {
    expect(planRotation({ mode: "queue", courts, waiting: waiting(["a", "b", "c", "d", "e"]), history: [] })).toEqual([
      { courtId: "court-1", courtLabel: "Court 1", teamA: ["a", "b"], teamB: ["c", "d"] },
    ]);
  });

  it("mixes a round across every court while prioritizing players with fewer games", () => {
    const plans = planRotation({
      mode: "random",
      courts,
      waiting: waiting(["a", "b", "c", "d", "e", "f", "g", "h", "i"]),
      history: [{ courtId: "court-1", courtPosition: 1, teamA: ["a", "b"], teamB: ["c", "d"], winner: "A", finishedAt: 1 }],
    });
    const selected = plans.flatMap((match) => [...match.teamA, ...match.teamB]);
    expect(plans).toHaveLength(2);
    expect(selected).toEqual(expect.arrayContaining(["e", "f", "g", "h", "i"]));
    expect(selected).toHaveLength(8);
  });

  it("mixes players across courts instead of only changing partners", () => {
    const plans = planRotation({
      mode: "random",
      courts,
      waiting: waiting(["a", "b", "c", "d", "e", "f", "g", "h"]),
      history: [
        { courtId: "court-1", courtPosition: 1, teamA: ["a", "b"], teamB: ["c", "d"], winner: "A", finishedAt: 1 },
        { courtId: "court-2", courtPosition: 2, teamA: ["e", "f"], teamB: ["g", "h"], winner: "A", finishedAt: 1 },
      ],
    });
    const firstCourt = new Set([...plans[0].teamA, ...plans[0].teamB]);
    expect([...firstCourt].some((id) => ["a", "b", "c", "d"].includes(id))).toBe(true);
    expect([...firstCourt].some((id) => ["e", "f", "g", "h"].includes(id))).toBe(true);
    expect(firstCourt).not.toEqual(new Set(["a", "b", "c", "d"]));
  });

  it("avoids immediately repeating partners in Mix It Up", () => {
    const [plan] = planRotation({
      mode: "random",
      courts: courts.slice(0, 1),
      waiting: waiting(["a", "b", "c", "d"]),
      history: [{ courtId: "court-1", courtPosition: 1, teamA: ["a", "b"], teamB: ["c", "d"], winner: "A", finishedAt: 1 }],
    });
    expect([plan.teamA, plan.teamB]).not.toContainEqual(["a", "b"]);
    expect([plan.teamA, plan.teamB]).not.toContainEqual(["c", "d"]);
  });

  it("moves winners up and losers down in Court Climb while splitting partners", () => {
    const plans = planRotation({
      mode: "king_of_court",
      courts,
      waiting: waiting(["a", "b", "c", "d", "e", "f", "g", "h"]),
      history: [
        { courtId: "court-1", courtPosition: 1, teamA: ["a", "b"], teamB: ["c", "d"], winner: "A", finishedAt: 2 },
        { courtId: "court-2", courtPosition: 2, teamA: ["e", "f"], teamB: ["g", "h"], winner: "B", finishedAt: 3 },
      ],
    });
    expect(plans).toEqual([
      { courtId: "court-1", courtLabel: "Court 1", teamA: ["a", "g"], teamB: ["b", "h"] },
      { courtId: "court-2", courtLabel: "Court 2", teamA: ["c", "e"], teamB: ["d", "f"] },
    ]);
  });

  it("explains the active setup in player language", () => {
    expect(rotationDescription("queue", { queueRule: "adaptive" })).toContain("queue gets busy");
    expect(rotationDescription("random", {})).toContain("new partners");
    expect(rotationDescription("king_of_court", {})).toContain("Court 1");
  });
});

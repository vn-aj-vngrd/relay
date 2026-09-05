import { describe, expect, it } from "vitest";

import {
  parsePlaySetup,
  planMatchFinish,
  planRotation,
  rotationDescription,
} from "./rotation";

const courts = [
  { id: "court-1", label: "Court 1", position: 1 },
  { id: "court-2", label: "Court 2", position: 2 },
];
const waiting = (ids: string[]) =>
  ids.map((id, index) => ({ id, position: index + 1 }));

describe("play rotation", () => {
  it("validates the host setup and keeps queue rules scoped to Paddle Stack", () => {
    expect(parsePlaySetup({ mode: "queue", queueRule: "adaptive" })).toEqual({
      mode: "queue",
      queueRule: "adaptive",
      partnerPolicy: "mix",
      pairs: [],
    });
    expect(
      parsePlaySetup({ mode: "random", queueRule: "winner_stays" })
    ).toEqual({ mode: "random" });
    expect(parsePlaySetup({ mode: "balanced" })).toEqual({ mode: "balanced" });
    const pairs: [string, string][] = [
      [
        "00000000-0000-4000-8000-000000000001",
        "00000000-0000-4000-8000-000000000002",
      ],
      [
        "00000000-0000-4000-8000-000000000003",
        "00000000-0000-4000-8000-000000000004",
      ],
    ];
    expect(
      parsePlaySetup({ mode: "queue", partnerPolicy: "fixed", pairs })
    ).toEqual({
      mode: "queue",
      queueRule: "adaptive",
      partnerPolicy: "fixed",
      pairs,
    });
    expect(() => parsePlaySetup({ mode: "manual" })).toThrow();
  });

  it("starts one continuous Paddle Stack match from queue order", () => {
    expect(
      planRotation({
        mode: "queue",
        courts,
        waiting: waiting(["a", "b", "c", "d", "e"]),
        history: [],
      })
    ).toEqual([
      {
        courtId: "court-1",
        courtLabel: "Court 1",
        teamA: ["a", "b"],
        teamB: ["c", "d"],
      },
    ]);
  });

  it("never copies retired court labels into new matches", () => {
    const legacyCourts = [
      { id: "court-3", label: "Court labels etc", position: 3 },
    ];
    const plans = planRotation({
      mode: "queue",
      courts: legacyCourts,
      waiting: waiting(["a", "b", "c", "d"]),
      history: [],
    });

    expect(plans[0]).toMatchObject({
      courtId: "court-3",
      courtLabel: "Court 3",
    });
    expect(legacyCourts[0].label).toBe("Court labels etc");
  });

  it("fills every open court when enough paddles are waiting", () => {
    expect(
      planRotation({
        mode: "queue",
        courts,
        waiting: waiting(["a", "b", "c", "d", "e", "f", "g", "h"]),
        history: [],
      })
    ).toHaveLength(2);
  });

  it("keeps declared pairs together in Paddle Stack even when player queue positions interleave", () => {
    expect(
      planRotation({
        mode: "queue",
        courts,
        waiting: waiting(["a", "c", "b", "d", "e", "f"]),
        history: [],
        fixedPairs: [
          ["a", "b"],
          ["c", "d"],
          ["e", "f"],
        ],
      })
    ).toEqual([
      {
        courtId: "court-1",
        courtLabel: "Court 1",
        teamA: ["a", "b"],
        teamB: ["c", "d"],
      },
    ]);
  });

  it("keeps an incomplete late pair out until both players arrive", () => {
    const fixedPairs: [string, string][] = [
      ["a", "b"],
      ["c", "d"],
      ["e", "f"],
    ];

    expect(
      planRotation({
        mode: "queue",
        courts,
        waiting: waiting(["a", "b", "c", "d", "e"]),
        history: [],
        fixedPairs,
      })
    ).toEqual([
      {
        courtId: "court-1",
        courtLabel: "Court 1",
        teamA: ["a", "b"],
        teamB: ["c", "d"],
      },
    ]);
  });

  it("schedules every fixed pair once per Team Round Robin round without repeats", () => {
    const fixedPairs: [string, string][] = [
      ["a", "b"],
      ["c", "d"],
      ["e", "f"],
      ["g", "h"],
    ];
    const first = planRotation({
      mode: "round_robin",
      courts,
      waiting: waiting(["a", "b", "c", "d", "e", "f", "g", "h"]),
      history: [],
      fixedPairs,
    });
    expect(first).toEqual([
      {
        courtId: "court-1",
        courtLabel: "Court 1",
        teamA: ["a", "b"],
        teamB: ["g", "h"],
      },
      {
        courtId: "court-2",
        courtLabel: "Court 2",
        teamA: ["c", "d"],
        teamB: ["e", "f"],
      },
    ]);
    const history = first.map((match, index) => ({
      courtId: match.courtId,
      courtPosition: index + 1,
      teamA: match.teamA,
      teamB: match.teamB,
      winner: "A" as const,
      finishedAt: index + 1,
    }));
    const second = planRotation({
      mode: "round_robin",
      courts,
      waiting: waiting(["a", "b", "c", "d", "e", "f", "g", "h"]),
      history,
      fixedPairs,
    });
    expect(second).toEqual([
      {
        courtId: "court-1",
        courtLabel: "Court 1",
        teamA: ["a", "b"],
        teamB: ["e", "f"],
      },
      {
        courtId: "court-2",
        courtLabel: "Court 2",
        teamA: ["g", "h"],
        teamB: ["c", "d"],
      },
    ]);
  });

  it("gives one pair a bye when Team Round Robin has an odd number of teams", () => {
    const fixedPairs: [string, string][] = [
      ["a", "b"],
      ["c", "d"],
      ["e", "f"],
    ];
    const allWaiting = waiting(["a", "b", "c", "d", "e", "f"]);
    const history: Array<{
      courtId: string;
      courtPosition: number;
      teamA: string[];
      teamB: string[];
      winner: "A";
      finishedAt: number;
    }> = [];
    for (let round = 0; round < 3; round += 1) {
      const [plan] = planRotation({
        mode: "round_robin",
        courts: courts.slice(0, 1),
        waiting: allWaiting,
        history,
        fixedPairs,
      });
      expect(plan).toBeDefined();
      history.push({
        courtId: plan.courtId,
        courtPosition: 1,
        teamA: plan.teamA,
        teamB: plan.teamB,
        winner: "A",
        finishedAt: round + 1,
      });
    }
    expect(
      new Set(
        history.map((match) =>
          [match.teamA.join(""), match.teamB.join("")].sort().join("-")
        )
      ).size
    ).toBe(3);
    expect(
      planRotation({
        mode: "round_robin",
        courts,
        waiting: allWaiting,
        history,
        fixedPairs,
      })
    ).toEqual([]);
  });

  it("rejects duplicate players in fixed partner setup", () => {
    expect(() =>
      parsePlaySetup({
        mode: "round_robin",
        pairs: [
          ["a", "b"],
          ["a", "c"],
        ],
      })
    ).toThrow();
  });

  it("mixes a round across every court while prioritizing players with fewer games", () => {
    const plans = planRotation({
      mode: "random",
      courts,
      waiting: waiting(["a", "b", "c", "d", "e", "f", "g", "h", "i"]),
      history: [
        {
          courtId: "court-1",
          courtPosition: 1,
          teamA: ["a", "b"],
          teamB: ["c", "d"],
          winner: "A",
          finishedAt: 1,
        },
      ],
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
        {
          courtId: "court-1",
          courtPosition: 1,
          teamA: ["a", "b"],
          teamB: ["c", "d"],
          winner: "A",
          finishedAt: 1,
        },
        {
          courtId: "court-2",
          courtPosition: 2,
          teamA: ["e", "f"],
          teamB: ["g", "h"],
          winner: "A",
          finishedAt: 1,
        },
      ],
    });
    const firstCourt = new Set([...plans[0].teamA, ...plans[0].teamB]);
    expect(
      [...firstCourt].some((id) => ["a", "b", "c", "d"].includes(id))
    ).toBe(true);
    expect(
      [...firstCourt].some((id) => ["e", "f", "g", "h"].includes(id))
    ).toBe(true);
    expect(firstCourt).not.toEqual(new Set(["a", "b", "c", "d"]));
  });

  it("avoids immediately repeating partners in Mix It Up", () => {
    const [plan] = planRotation({
      mode: "random",
      courts: courts.slice(0, 1),
      waiting: waiting(["a", "b", "c", "d"]),
      history: [
        {
          courtId: "court-1",
          courtPosition: 1,
          teamA: ["a", "b"],
          teamB: ["c", "d"],
          winner: "A",
          finishedAt: 1,
        },
      ],
    });
    expect([plan.teamA, plan.teamB]).not.toContainEqual(["a", "b"]);
    expect([plan.teamA, plan.teamB]).not.toContainEqual(["c", "d"]);
  });

  it("balances team experience without overriding queue selection", () => {
    const [plan] = planRotation({
      mode: "balanced",
      courts: courts.slice(0, 1),
      waiting: [
        { id: "a", position: 1, experience: 4 },
        { id: "b", position: 2, experience: 4 },
        { id: "c", position: 3, experience: 1 },
        { id: "d", position: 4, experience: 1 },
        { id: "later", position: 5, experience: 2 },
      ],
      history: [],
    });
    const experience = new Map([
      ["a", 4],
      ["b", 4],
      ["c", 1],
      ["d", 1],
    ]);
    const total = (team: string[]) =>
      team.reduce((sum, id) => sum + (experience.get(id) ?? 0), 0);
    expect(Math.abs(total(plan.teamA) - total(plan.teamB))).toBe(0);
    expect([...plan.teamA, ...plan.teamB]).not.toContain("later");
  });

  it("moves winners up and losers down in Court Climb while splitting partners", () => {
    const plans = planRotation({
      mode: "king_of_court",
      courts,
      waiting: waiting(["a", "b", "c", "d", "e", "f", "g", "h"]),
      history: [
        {
          courtId: "court-1",
          courtPosition: 1,
          teamA: ["a", "b"],
          teamB: ["c", "d"],
          winner: "A",
          finishedAt: 2,
        },
        {
          courtId: "court-2",
          courtPosition: 2,
          teamA: ["e", "f"],
          teamB: ["g", "h"],
          winner: "B",
          finishedAt: 3,
        },
      ],
    });
    expect(plans).toEqual([
      {
        courtId: "court-1",
        courtLabel: "Court 1",
        teamA: ["a", "g"],
        teamB: ["b", "h"],
      },
      {
        courtId: "court-2",
        courtLabel: "Court 2",
        teamA: ["c", "e"],
        teamB: ["d", "f"],
      },
    ]);
  });

  it("returns all four players behind the waiting queue after a four-off match", () => {
    expect(
      planMatchFinish({
        mode: "queue",
        queueRule: "four_off",
        waitingPlayerIds: ["e", "f"],
        teamA: ["a", "b"],
        teamB: ["c", "d"],
        winner: "A",
        previousCourtPlayerIds: [],
      })
    ).toEqual({
      winnersStay: false,
      returnedPlayerIds: ["a", "b", "c", "d"],
      orderedPlayerIds: ["e", "f", "a", "b", "c", "d"],
    });
  });

  it("keeps winners for one more match when the Paddle Stack is short", () => {
    expect(
      planMatchFinish({
        mode: "queue",
        queueRule: "adaptive",
        waitingPlayerIds: ["e", "f"],
        teamA: ["a", "b"],
        teamB: ["c", "d"],
        winner: "A",
        previousCourtPlayerIds: [],
      })
    ).toMatchObject({
      winnersStay: true,
      orderedPlayerIds: ["a", "b", "e", "f", "c", "d"],
    });
  });

  it("rotates winners off after they have already stayed", () => {
    expect(
      planMatchFinish({
        mode: "queue",
        queueRule: "winner_stays",
        waitingPlayerIds: ["e", "f"],
        teamA: ["a", "b"],
        teamB: ["c", "d"],
        winner: "A",
        previousCourtPlayerIds: ["a", "b", "x", "y"],
      }).winnersStay
    ).toBe(false);
  });

  it("does not keep winners without a court history seam", () => {
    expect(
      planMatchFinish({
        mode: "queue",
        queueRule: "winner_stays",
        waitingPlayerIds: ["e", "f"],
        teamA: ["a", "b"],
        teamB: ["c", "d"],
        winner: "A",
        previousCourtPlayerIds: null,
      }).winnersStay
    ).toBe(false);
  });

  it("explains the active setup in player language", () => {
    expect(rotationDescription("queue", { queueRule: "adaptive" })).toContain(
      "queue gets busy"
    );
    expect(rotationDescription("random", {})).toContain("new partners");
    expect(rotationDescription("balanced", {})).toContain("playing experience");
    expect(rotationDescription("king_of_court", {})).toContain("Court 1");
    expect(rotationDescription("round_robin", {})).toContain(
      "every other pair"
    );
  });
});

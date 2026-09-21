import { describe, expect, it } from "vitest";

import {
  assertRotationPreview,
  changedLineupMessage,
  type NextRotationInput,
  previewNextRotation,
  rotationPlanKey,
} from "./next-rotation";

const input = (
  overrides: Partial<NextRotationInput> = {}
): NextRotationInput => ({
  mode: "queue",
  queueRule: "four_off",
  courts: [{ id: "court", label: "Court 1", position: 1 }],
  activeCourtIds: [],
  waiting: ["a", "b", "c", "d"].map((id, position) => ({ id, position })),
  history: [],
  fixedPairs: [],
  ...overrides,
});

describe("Up next", () => {
  it("shows waiting players while an occupied court has no final assignment", () => {
    const preview = previewNextRotation(input({ activeCourtIds: ["court"] }));
    expect(preview.plans).toEqual([]);
    expect(preview.preparing).toEqual(["a", "b", "c", "d"]);
    expect(preview.upcomingTeams).toEqual({
      teamA: ["a", "b"],
      teamB: ["c", "d"],
    });
  });

  it.each(["winner_stays", "adaptive"] as const)(
    "does not guess winners for %s",
    (queueRule) => {
      const preview = previewNextRotation(
        input({
          queueRule,
          activeCourtIds: ["court"],
          waiting: input().waiting.slice(0, 3),
        })
      );
      expect(preview.preparing).toEqual(["a", "b"]);
      expect(preview.plans).toEqual([]);
      expect(preview.upcomingTeams).toBeUndefined();
      expect(preview.message).toContain("result and rotation rule");
    }
  );

  it("keeps fixed pairs together and excludes an unavailable partner", () => {
    const preview = previewNextRotation(
      input({
        activeCourtIds: ["court"],
        fixedPairs: [
          ["a", "missing"],
          ["c", "b"],
        ],
      })
    );
    expect(preview.preparing).toEqual(["c", "b"]);
    expect(
      previewNextRotation(input({ fixedPairs: [["a", "missing"]] })).plans
    ).toEqual([]);
  });

  it("assigns only open, unoccupied courts without duplicating players", () => {
    const preview = previewNextRotation(
      input({
        courts: [
          { id: "court", label: "Court 1", position: 1 },
          { id: "other", label: "Court 2", position: 2 },
        ],
        activeCourtIds: ["court"],
      })
    );
    expect(preview.plans).toEqual([
      {
        courtId: "other",
        courtLabel: "Court 2",
        teamA: ["a", "b"],
        teamB: ["c", "d"],
      },
    ]);
    expect(previewNextRotation(input({ courts: [] })).message).toContain(
      "No courts are open"
    );
  });

  it.each(["random", "balanced", "king_of_court", "round_robin"] as const)(
    "waits for every court in %s without treating waiting players as confirmed teams",
    (mode) => {
      const preview = previewNextRotation(
        input({ mode, activeCourtIds: ["court"] })
      );
      expect(preview.plans).toEqual([]);
      expect(preview.preparationLabel).toBe("Waiting this round");
      expect(preview.message).toContain("Finish every court");
    }
  );

  it("explains insufficient players and Court Climb availability", () => {
    expect(
      previewNextRotation(input({ waiting: input().waiting.slice(0, 2) }))
        .message
    ).toBe("Waiting for 2 more players.");
    expect(
      previewNextRotation(input({ mode: "king_of_court", waiting: [] })).message
    ).toContain("full roster");
  });

  it("does not replay a completed round-robin pairing", () => {
    const preview = previewNextRotation(
      input({
        mode: "round_robin",
        fixedPairs: [
          ["a", "b"],
          ["c", "d"],
        ],
        history: [
          {
            courtId: "court",
            courtPosition: 1,
            teamA: ["a", "b"],
            teamB: ["c", "d"],
            winner: "A",
            finishedAt: 1,
          },
        ],
      })
    );
    expect(preview.plans).toEqual([]);
    expect(preview.message).toContain("No unplayed matchup");
  });

  it("rejects a changed court, team or missing preview before starting", () => {
    const plans = previewNextRotation(input()).plans;
    const key = rotationPlanKey(plans);
    expect(() => assertRotationPreview(plans, key)).not.toThrow();
    expect(() => assertRotationPreview(plans, null)).toThrow(
      changedLineupMessage
    );
    expect(() =>
      assertRotationPreview([{ ...plans[0], courtId: "other" }], key)
    ).toThrow(changedLineupMessage);
    expect(() =>
      assertRotationPreview([{ ...plans[0], teamA: ["a", "new"] }], key)
    ).toThrow(changedLineupMessage);
  });
});

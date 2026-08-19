import { describe, expect, it } from "vitest";

import { buildSessionRecap, type RecapMatch } from "./recap";

const at = (minute: number) => new Date(`2026-08-19T10:${String(minute).padStart(2, "0")}:00Z`);

const matches: RecapMatch[] = [
  {
    id: "one",
    courtLabel: "Court 1",
    teamA: ["a", "b"],
    teamB: ["c", "d"],
    scoreA: 11,
    scoreB: 8,
    status: "completed",
    startedAt: at(0),
    finishedAt: at(12),
  },
  {
    id: "two",
    courtLabel: "Court 1",
    teamA: ["a", "c"],
    teamB: ["b", "d"],
    scoreA: 10,
    scoreB: 12,
    status: "completed",
    startedAt: at(15),
    finishedAt: at(30),
  },
];
const players = [
  { id: "a", name: "Van" },
  { id: "b", name: "AJ" },
  { id: "c", name: "Mika" },
  { id: "d", name: "Bea" },
];

describe("buildSessionRecap", () => {
  it("derives only defensible highlights from completed matches", () => {
    const recap = buildSessionRecap(matches, players);

    expect(recap.matchCount).toBe(2);
    expect(recap.totalPoints).toBe(41);
    expect(recap.playMinutes).toBe(30);
    expect(recap.busiestCourt).toEqual({ label: "Court 1", matches: 2 });
    expect(recap.closestMatch).toEqual({
      courtLabel: "Court 1",
      score: "10–12",
      scoreA: 10,
      scoreB: 12,
      teamA: ["Van", "Mika"],
      teamB: ["AJ", "Bea"],
      margin: 2,
    });
    expect(recap.standings[0].wins).toBe(2);
  });

  it("returns a useful empty recap without inventing winners", () => {
    const recap = buildSessionRecap([], players);
    expect(recap.matchCount).toBe(0);
    expect(recap.standout).toBeNull();
    expect(recap.topPair).toBeNull();
    expect(recap.closestMatch).toBeNull();
  });
});

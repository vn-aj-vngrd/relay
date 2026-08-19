import { describe, expect, it } from "vitest";

import { buildSessionRecap, type RecapMatch } from "./recap";
import { recapShareTemplates, viewerStanding } from "./recap-share";

const players = [
  { id: "a", name: "Van" },
  { id: "b", name: "AJ" },
  { id: "c", name: "Mika" },
  { id: "d", name: "Bea" },
];
const match: RecapMatch = {
  id: "match",
  courtLabel: "Court 1",
  teamA: ["a", "b"],
  teamB: ["c", "d"],
  scoreA: 11,
  scoreB: 8,
  status: "completed",
  startedAt: new Date("2026-08-19T10:00:00Z"),
  finishedAt: new Date("2026-08-19T10:12:00Z"),
};

describe("recap share templates", () => {
  it("offers only templates supported by real session data", () => {
    const recap = buildSessionRecap([match], players);
    expect(recapShareTemplates(recap, "a").map(({ id }) => id)).toEqual([
      "overview",
      "personal",
      "winning-team",
      "leader",
      "standings",
      "closest",
      "court",
    ]);
    expect(viewerStanding(recap, "a")).toMatchObject({ name: "Van", wins: 1, rank: 1 });
  });

  it("keeps an empty session shareable without inventing results", () => {
    const recap = buildSessionRecap([], players);
    expect(recapShareTemplates(recap, "a").map(({ id }) => id)).toEqual(["overview"]);
    expect(viewerStanding(recap, "a")).toBeNull();
  });
});

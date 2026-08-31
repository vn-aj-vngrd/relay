import { describe, expect, it } from "vitest";

import { calculateStandings } from "./domain";

describe("match domain", () => {
  it("calculates recreational session standings", () => {
    const rows = calculateStandings([
      { teamA: ["van", "aj"], teamB: ["mika", "john"], scoreA: 11, scoreB: 7, status: "completed" },
    ]);
    expect(rows[0]).toMatchObject({ playerId: "van", wins: 1, differential: 4, winPercentage: 1 });
    expect(rows.at(-1)).toMatchObject({ losses: 1, differential: -4 });
  });
});

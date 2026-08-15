import { describe, expect, it } from "vitest";
import { calculateStandings, queueTeams } from "./domain";

describe("match domain", () => {
  it("calculates recreational session standings", () => {
    const rows = calculateStandings([{ teamA: ["van", "aj"], teamB: ["mika", "john"], scoreA: 11, scoreB: 7, status: "completed" }]);
    expect(rows[0]).toMatchObject({ playerId: "van", wins: 1, differential: 4, winPercentage: 1 });
    expect(rows.at(-1)).toMatchObject({ losses: 1, differential: -4 });
  });
  it("assigns full courts from queue order and leaves the rest waiting", () => {
    const result = queueTeams(["a", "b", "c", "d", "e"], 2);
    expect(result.matches).toEqual([{ teamA: ["a", "b"], teamB: ["c", "d"] }]);
    expect(result.waiting).toEqual(["e"]);
  });
});

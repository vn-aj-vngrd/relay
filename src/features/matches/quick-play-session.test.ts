import { describe, expect, it } from "vitest";

import {
  canStartNextQuickPlayMatches,
  finishQuickPlayMatch,
  type QuickPlayConfiguration,
  quickPlayStandings,
  restoreQuickPlaySession,
  scoreQuickPlayMatch,
  serializeQuickPlaySession,
  startNextQuickPlayMatches,
  startQuickPlay,
} from "./quick-play-session";

const players = (count: number) =>
  Array.from({ length: count }, (_, index) => ({
    id: `player-${index + 1}`,
    name: `Player ${index + 1}`,
    experience: (index % 4) + 1,
  }));

function configuration(overrides: Partial<QuickPlayConfiguration> = {}): QuickPlayConfiguration {
  return {
    players: players(8),
    courtCount: 2,
    mode: "random",
    queueRule: "adaptive",
    fixedPairs: [],
    ...overrides,
  };
}

function giveSideOneAWin(session: ReturnType<typeof startQuickPlay>, matchId: string) {
  let next = session;
  for (let point = 0; point < 11; point += 1) next = scoreQuickPlayMatch(next, matchId, 0, 1);
  return finishQuickPlayMatch(next, matchId);
}

describe("local Quick Play session", () => {
  it("runs a complete Mix It Up round and prepares a new rotation", () => {
    let session = startQuickPlay(configuration());
    expect(session.activeMatches).toHaveLength(2);
    const firstTeams = session.activeMatches.map((match) => [match.teamA, match.teamB]);

    for (const match of [...session.activeMatches]) session = giveSideOneAWin(session, match.id);

    expect(session.completedMatches).toHaveLength(2);
    expect(session.waitingPlayerIds).toHaveLength(8);
    expect(canStartNextQuickPlayMatches(session)).toBe(true);

    session = startNextQuickPlayMatches(session);
    expect(session.activeMatches).toHaveLength(2);
    expect(session.activeMatches.map((match) => [match.teamA, match.teamB])).not.toEqual(firstTeams);
  });

  it("returns finished Paddle Stack players behind the waiting queue", () => {
    let session = startQuickPlay(
      configuration({ players: players(5), courtCount: 1, mode: "queue", queueRule: "four_off" }),
    );
    session = giveSideOneAWin(session, session.activeMatches[0].id);

    expect(session.waitingPlayerIds).toEqual(["player-5", "player-1", "player-2", "player-3", "player-4"]);

    session = startNextQuickPlayMatches(session);
    expect([...session.activeMatches[0].teamA, ...session.activeMatches[0].teamB]).toContain("player-5");
  });

  it("tracks local standings from completed scores", () => {
    let session = startQuickPlay(configuration({ players: players(4), courtCount: 1, mode: "random" }));
    const matchId = session.activeMatches[0].id;
    session = scoreQuickPlayMatch(session, matchId, 0, 1);
    session = scoreQuickPlayMatch(session, matchId, 0, 1);
    session = scoreQuickPlayMatch(session, matchId, 1, 1);
    session = finishQuickPlayMatch(session, matchId);

    expect(quickPlayStandings(session).slice(0, 2)).toEqual([
      expect.objectContaining({ name: "Player 1", wins: 1, differential: 1 }),
      expect.objectContaining({ name: "Player 2", wins: 1, differential: 1 }),
    ]);
  });

  it("restores a versioned browser session and rejects invalid stored data", () => {
    const session = startQuickPlay(configuration());
    expect(restoreQuickPlaySession(serializeQuickPlaySession(session))).toEqual(session);
    expect(restoreQuickPlaySession('{"version":1,"session":{"players":[]}}')).toBeNull();
    expect(restoreQuickPlaySession("not-json")).toBeNull();
  });

  it("enforces court capacity, Court Climb, and fixed-pair requirements before play starts", () => {
    expect(() => startQuickPlay(configuration({ players: players(4), courtCount: 2 }))).toThrow(
      "Add 4 more players for 2 courts.",
    );
    expect(() => startQuickPlay(configuration({ players: players(24), courtCount: 7 }))).toThrow(
      "Choose between 1 and 6 active courts.",
    );
    expect(() => startQuickPlay(configuration({ players: players(7), courtCount: 1, mode: "king_of_court" }))).toThrow(
      "Court Climb needs exactly four players per court.",
    );
    expect(() =>
      startQuickPlay(configuration({ players: players(5), courtCount: 1, mode: "round_robin", fixedPairs: [] })),
    ).toThrow("Fixed pairs need an even number of players.");
  });
});

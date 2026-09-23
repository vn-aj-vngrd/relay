import { describe, expect, it } from "vitest";

import {
  addQuickPlayPlayer,
  cancelQuickPlayMatch,
  canStartNextQuickPlayMatches,
  correctQuickPlayMatchScore,
  endQuickPlay,
  finishQuickPlayMatch,
  type QuickPlayConfiguration,
  quickPlayNextRotation,
  quickPlayRecap,
  quickPlayStandings,
  reorderQuickPlayQueue,
  restoreQuickPlaySession,
  scoreQuickPlayMatch,
  serializeQuickPlaySession,
  setQuickPlayCourtAvailability,
  setQuickPlayPlayerAvailability,
  startNextQuickPlayMatches,
  startQuickPlay,
} from "./quick-play-session";

const players = (count: number) =>
  Array.from({ length: count }, (_, index) => ({
    id: `player-${index + 1}`,
    name: `Player ${index + 1}`,
    experience: (index % 4) + 1,
  }));

function configuration(
  overrides: Partial<QuickPlayConfiguration> = {}
): QuickPlayConfiguration {
  return {
    players: players(8),
    courtCount: 2,
    mode: "random",
    queueRule: "adaptive",
    fixedPairs: [],
    roundDurationMinutes: null,
    ...overrides,
  };
}

function giveSideOneAWin(
  session: ReturnType<typeof startQuickPlay>,
  matchId: string
) {
  let next = session;
  for (let point = 0; point < 11; point += 1)
    next = scoreQuickPlayMatch(next, matchId, 0, 1);
  return finishQuickPlayMatch(next, matchId);
}

describe("local Quick Play session", () => {
  it("appends a late arrival without changing matches, scores, or existing queue order", () => {
    const session = startQuickPlay(
      configuration({ mode: "queue", courtCount: 1 })
    );
    const scored = scoreQuickPlayMatch(
      session,
      session.activeMatches[0].id,
      0,
      1
    );
    const next = addQuickPlayPlayer(scored, {
      id: "late",
      name: "  Ana  ",
      experience: 2,
    });
    expect(next.waitingPlayerIds).toEqual([...scored.waitingPlayerIds, "late"]);
    expect(next.activeMatches).toEqual(scored.activeMatches);
    expect(next.completedMatches).toEqual(scored.completedMatches);
    expect(next.players.at(-1)?.name).toBe("Ana");
    expect(restoreQuickPlaySession(serializeQuickPlaySession(next))).toEqual(
      next
    );
    expect(scored.players).toHaveLength(8);
  });

  it("rejects unsupported arrivals, duplicate names, full rosters, and ended games", () => {
    const player = { id: "late", name: "Ana", experience: 2 };
    const session = startQuickPlay(
      configuration({ mode: "queue", courtCount: 1 })
    );
    expect(() =>
      addQuickPlayPlayer(session, { ...player, name: " player 1 " })
    ).toThrow("different name");
    expect(() => addQuickPlayPlayer(session, { ...player, name: " " })).toThrow(
      "player name"
    );
    expect(() =>
      addQuickPlayPlayer(session, { ...player, id: session.players[0].id })
    ).toThrow("already");
    expect(() =>
      addQuickPlayPlayer({ ...session, endedAt: 1 }, player)
    ).toThrow("ended");
    expect(() =>
      addQuickPlayPlayer({ ...session, mode: "random" }, player)
    ).toThrow("mixed-partner");
    expect(() =>
      addQuickPlayPlayer(
        { ...session, fixedPairs: [["player-1", "player-2"]] },
        player
      )
    ).toThrow("mixed-partner");
    expect(() =>
      addQuickPlayPlayer(
        startQuickPlay(configuration({ players: players(24), mode: "queue" })),
        player
      )
    ).toThrow("24 players");
  });

  it("prepares the queue, removes resting players, and starts the displayed teams", () => {
    let session = startQuickPlay(
      configuration({
        players: players(8),
        courtCount: 1,
        mode: "queue",
        queueRule: "four_off",
      })
    );
    expect(quickPlayNextRotation(session).preparing).toEqual([
      "player-5",
      "player-6",
      "player-7",
      "player-8",
    ]);
    session = setQuickPlayPlayerAvailability(session, "player-5", "sit_out");
    expect(quickPlayNextRotation(session).preparing).not.toContain("player-5");
    session = giveSideOneAWin(session, session.activeMatches[0].id);
    const preview = quickPlayNextRotation(session);
    expect(preview.plans).toHaveLength(1);
    session = startNextQuickPlayMatches(session);
    expect(session.activeMatches[0]).toMatchObject(preview.plans[0]);
  });

  it("runs a complete Mix It Up round and prepares a new rotation", () => {
    let session = startQuickPlay(configuration());
    expect(session.activeMatches).toHaveLength(2);
    const firstTeams = session.activeMatches.map((match) => [
      match.teamA,
      match.teamB,
    ]);

    for (const match of [...session.activeMatches])
      session = giveSideOneAWin(session, match.id);

    expect(session.completedMatches).toHaveLength(2);
    expect(session.waitingPlayerIds).toHaveLength(8);
    expect(canStartNextQuickPlayMatches(session)).toBe(true);

    session = startNextQuickPlayMatches(session);
    expect(session.activeMatches).toHaveLength(2);
    expect(
      session.activeMatches.map((match) => [match.teamA, match.teamB])
    ).not.toEqual(firstTeams);
  });

  it("returns finished Paddle Stack players behind the waiting queue", () => {
    let session = startQuickPlay(
      configuration({
        players: players(5),
        courtCount: 1,
        mode: "queue",
        queueRule: "four_off",
      })
    );
    session = giveSideOneAWin(session, session.activeMatches[0].id);

    expect(session.waitingPlayerIds).toEqual([
      "player-5",
      "player-1",
      "player-2",
      "player-3",
      "player-4",
    ]);

    session = startNextQuickPlayMatches(session);
    expect([
      ...session.activeMatches[0].teamA,
      ...session.activeMatches[0].teamB,
    ]).toContain("player-5");
  });

  it("tracks local standings from completed scores", () => {
    let session = startQuickPlay(
      configuration({ players: players(4), courtCount: 1, mode: "random" })
    );
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

  it("corrects a completed score without changing later court assignments", () => {
    let session = startQuickPlay(
      configuration({ players: players(4), courtCount: 1, mode: "random" })
    );
    const matchId = session.activeMatches[0].id;
    session = scoreQuickPlayMatch(session, matchId, 0, 1);
    session = finishQuickPlayMatch(session, matchId);
    const waitingAfterFinish = session.waitingPlayerIds;

    session = correctQuickPlayMatchScore(session, matchId, [3, 5]);

    expect(session.completedMatches[0]).toMatchObject({
      scores: [3, 5],
      winner: "B",
    });
    expect(session.waitingPlayerIds).toEqual(waitingAfterFinish);
    expect(() => correctQuickPlayMatchScore(session, matchId, [4, 4])).toThrow(
      "A completed match needs a winner."
    );
  });

  it("cancels one queue match and restores its players to the front", () => {
    const session = startQuickPlay(
      configuration({
        players: players(9),
        courtCount: 2,
        mode: "queue",
      })
    );
    const cancelled = session.activeMatches[0];
    const next = cancelQuickPlayMatch(session, cancelled.id);

    expect(next.activeMatches).toHaveLength(1);
    expect(next.waitingPlayerIds.slice(0, 4)).toEqual([
      ...cancelled.teamA,
      ...cancelled.teamB,
    ]);
  });

  it("cancels the whole active round in round-based modes", () => {
    const session = startQuickPlay(configuration());
    const activePlayerIds = session.activeMatches.flatMap((match) => [
      ...match.teamA,
      ...match.teamB,
    ]);
    const next = cancelQuickPlayMatch(session, session.activeMatches[0].id);

    expect(next.activeMatches).toHaveLength(0);
    expect(next.waitingPlayerIds).toEqual(activePlayerIds);
    expect(next.completedMatches).toHaveLength(0);
  });

  it("restores a versioned browser session and rejects invalid stored data", () => {
    const session = startQuickPlay(configuration());
    expect(restoreQuickPlaySession(serializeQuickPlaySession(session))).toEqual(
      session
    );
    expect(
      restoreQuickPlaySession('{"version":1,"session":{"players":[]}}')
    ).toBeNull();
    expect(restoreQuickPlaySession("not-json")).toBeNull();
  });

  it("keeps a closed court out of future assignments", () => {
    let session = startQuickPlay(
      configuration({ players: players(8), courtCount: 2, mode: "queue" })
    );
    session = setQuickPlayCourtAvailability(session, "court-1", false);
    const courtOne = session.activeMatches.find(
      (match) => match.courtId === "court-1"
    )!;
    session = giveSideOneAWin(session, courtOne.id);

    expect(session.unavailableCourtIds).toContain("court-1");
    expect(canStartNextQuickPlayMatches(session)).toBe(false);
  });

  it("reorders waiting fixed partners together", () => {
    const session = startQuickPlay(
      configuration({
        players: players(8),
        courtCount: 1,
        mode: "queue",
        fixedPairs: [
          ["player-1", "player-2"],
          ["player-3", "player-4"],
          ["player-5", "player-6"],
          ["player-7", "player-8"],
        ],
      })
    );
    expect(
      reorderQuickPlayQueue(session, "player-7", "top").waitingPlayerIds.slice(
        0,
        2
      )
    ).toEqual(["player-7", "player-8"]);
  });

  it("enforces court capacity, Court Climb, and fixed-pair requirements before play starts", () => {
    expect(() =>
      startQuickPlay(configuration({ players: players(4), courtCount: 2 }))
    ).toThrow("Add 4 more players for 2 courts.");
    expect(() =>
      startQuickPlay(configuration({ players: players(24), courtCount: 7 }))
    ).toThrow("Choose between 1 and 6 active courts.");
    expect(() =>
      startQuickPlay(
        configuration({
          players: players(7),
          courtCount: 1,
          mode: "king_of_court",
        })
      )
    ).toThrow("Court Climb needs exactly four players per court.");
    expect(() =>
      startQuickPlay(
        configuration({
          players: players(5),
          courtCount: 1,
          mode: "round_robin",
          fixedPairs: [],
        })
      )
    ).toThrow("Fixed pairs need an even number of players.");
  });
});

describe("Quick Play completion", () => {
  it("retains results across reload and prevents another rotation", () => {
    const session = startQuickPlay(
      configuration({ players: players(4), courtCount: 1 })
    );
    const match = session.activeMatches[0];
    expect(() => endQuickPlay(session)).toThrow(
      "Finish or cancel active matches"
    );
    const finished = finishQuickPlayMatch(
      scoreQuickPlayMatch(session, match.id, 0, 1),
      match.id
    );
    const ended = endQuickPlay(finished);
    const restored = restoreQuickPlaySession(serializeQuickPlaySession(ended));
    expect(restored?.completedMatches).toEqual(finished.completedMatches);
    expect(restored?.endedAt).toBe(ended.endedAt);
    expect(canStartNextQuickPlayMatches(ended)).toBe(false);
    expect(startNextQuickPlayMatches(ended).activeMatches).toEqual([]);
  });
});

it("records real recap timing without changing rotation order and handles legacy storage", () => {
  let session = startQuickPlay(configuration());
  const match = session.activeMatches[0]!;
  session = scoreQuickPlayMatch(session, match.id, 0, 1);
  session = finishQuickPlayMatch(
    session,
    match.id,
    match.startedAt + 12 * 60_000
  );
  expect(session.completedMatches[0]?.finishedAt).toBe(1);
  expect(quickPlayRecap(session).playMinutes).toBe(12);
  const restored = restoreQuickPlaySession(serializeQuickPlaySession(session));
  expect(restored).not.toBeNull();
  expect(quickPlayRecap(restored!).playMinutes).toBe(12);
  const legacy = {
    ...session,
    completedMatches: session.completedMatches.map(
      ({ completedAt: _completedAt, ...oldMatch }) => oldMatch
    ),
  };
  const legacyRecap = quickPlayRecap(legacy);
  expect(legacyRecap.playMinutes).toBe(0);
  expect(legacyRecap.matchCount).toBe(1);
  expect(legacyRecap.totalPoints).toBe(1);
});

describe("Quick Play availability", () => {
  it("removes waiting players and rejoins them at the back without duplicates", () => {
    let session = startQuickPlay(
      configuration({ mode: "queue", courtCount: 1 })
    );
    const id = session.waitingPlayerIds[0];
    session = setQuickPlayPlayerAvailability(session, id, "sit_out");
    expect(session.waitingPlayerIds).not.toContain(id);
    expect(session.restingPlayerIds).toContain(id);
    session = setQuickPlayPlayerAvailability(session, id, "ready");
    expect(session.waitingPlayerIds.at(-1)).toBe(id);
    const same = setQuickPlayPlayerAvailability(session, id, "ready");
    expect(same).toBe(session);
    expect(restoreQuickPlaySession(serializeQuickPlaySession(session))).toEqual(
      session
    );
  });

  it.each(["finish", "cancel"])("honors deferred rest after %s", (action) => {
    let session = startQuickPlay(
      configuration({ mode: "queue", courtCount: 1 })
    );
    const match = session.activeMatches[0];
    const id = match.teamA[0];
    session = setQuickPlayPlayerAvailability(session, id, "sit_out");
    expect(session.activeMatches[0].teamA).toContain(id);
    expect(
      restoreQuickPlaySession(serializeQuickPlaySession(session))
        ?.restingPlayerIds
    ).toContain(id);
    session =
      action === "finish"
        ? giveSideOneAWin(session, match.id)
        : cancelQuickPlayMatch(session, match.id);
    expect(session.waitingPlayerIds).not.toContain(id);
    session = startNextQuickPlayMatches(session);
    expect(
      session.activeMatches.flatMap((item) => [...item.teamA, ...item.teamB])
    ).not.toContain(id);
  });

  it("lets active players undo deferred rest without entering the queue twice", () => {
    let session = startQuickPlay(configuration());
    const match = session.activeMatches[0];
    const id = match.teamA[0];
    session = setQuickPlayPlayerAvailability(session, id, "sit_out");
    session = setQuickPlayPlayerAvailability(session, id, "ready");
    expect(session.restingPlayerIds).not.toContain(id);
    expect(session.waitingPlayerIds).not.toContain(id);
    session = giveSideOneAWin(session, match.id);
    expect(
      session.waitingPlayerIds.filter((player) => player === id)
    ).toHaveLength(1);
  });

  it.each(["queue", "round_robin"] as const)(
    "keeps incomplete fixed pairs out of %s matches",
    (mode) => {
      let session = startQuickPlay(
        configuration({
          mode,
          courtCount: 1,
          fixedPairs: [
            ["player-1", "player-2"],
            ["player-3", "player-4"],
            ["player-5", "player-6"],
            ["player-7", "player-8"],
          ],
        })
      );
      session = cancelQuickPlayMatch(session, session.activeMatches[0].id);
      for (const id of ["player-1", "player-3", "player-5", "player-7"])
        session = setQuickPlayPlayerAvailability(session, id, "sit_out");
      expect(canStartNextQuickPlayMatches(session)).toBe(false);
      session = setQuickPlayPlayerAvailability(session, "player-1", "ready");
      session = setQuickPlayPlayerAvailability(session, "player-3", "ready");
      expect(canStartNextQuickPlayMatches(session)).toBe(true);
    }
  );

  it("pauses Court Climb until its full roster rejoins", () => {
    let session = startQuickPlay(configuration({ mode: "king_of_court" }));
    session = setQuickPlayPlayerAvailability(
      session,
      session.players[0].id,
      "sit_out"
    );
    for (const match of session.activeMatches)
      session = giveSideOneAWin(session, match.id);
    expect(canStartNextQuickPlayMatches(session)).toBe(false);
    session = setQuickPlayPlayerAvailability(
      session,
      session.players[0].id,
      "ready"
    );
    expect(startNextQuickPlayMatches(session).activeMatches).toHaveLength(2);
  });

  it("restores legacy sessions with everyone available", () => {
    const session = startQuickPlay(configuration());
    const stored = JSON.parse(serializeQuickPlaySession(session));
    stored.session.restingPlayerIds = undefined;
    expect(
      restoreQuickPlaySession(JSON.stringify(stored))?.restingPlayerIds
    ).toEqual([]);
  });
});

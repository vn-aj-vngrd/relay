import { calculateStandings } from "./domain";
import { planMatchFinish, planRotation, type PlayMode, type QueueRule, type RotationHistory } from "./rotation";

export type QuickPlayPlayer = {
  id: string;
  name: string;
  experience: number;
};

export type QuickPlayMatch = {
  id: string;
  courtId: string;
  courtLabel: string;
  teamA: string[];
  teamB: string[];
  scores: [number, number];
  status: "active" | "completed";
  winner: "A" | "B" | null;
  finishedAt: number | null;
};

export type QuickPlayConfiguration = {
  players: QuickPlayPlayer[];
  courtCount: number;
  mode: PlayMode;
  queueRule: QueueRule;
  fixedPairs: Array<[string, string]>;
};

export type QuickPlaySession = QuickPlayConfiguration & {
  waitingPlayerIds: string[];
  activeMatches: QuickPlayMatch[];
  completedMatches: QuickPlayMatch[];
  nextMatchNumber: number;
};

function courts(count: number) {
  return Array.from({ length: count }, (_, index) => ({
    id: `court-${index + 1}`,
    label: `Court ${index + 1}`,
    position: index + 1,
  }));
}

function rotationHistory(session: QuickPlaySession): RotationHistory[] {
  return session.completedMatches.map((match) => ({
    courtId: match.courtId,
    courtPosition: Number(match.courtId.replace("court-", "")),
    teamA: match.teamA,
    teamB: match.teamB,
    winner: match.winner ?? "A",
    finishedAt: match.finishedAt ?? 0,
  }));
}

function nextPlans(session: QuickPlaySession) {
  if (session.mode !== "queue" && session.activeMatches.length) return [];
  const occupiedCourts = new Set(session.activeMatches.map((match) => match.courtId));
  const availableCourts =
    session.mode === "queue"
      ? courts(session.courtCount).filter((court) => !occupiedCourts.has(court.id))
      : courts(session.courtCount);
  const experience = new Map(session.players.map((player) => [player.id, player.experience]));
  return planRotation({
    mode: session.mode,
    courts: availableCourts,
    waiting: session.waitingPlayerIds.map((id, index) => ({ id, position: index + 1, experience: experience.get(id) })),
    history: rotationHistory(session),
    fixedPairs: session.fixedPairs,
  });
}

function validateConfiguration(configuration: QuickPlayConfiguration) {
  if (configuration.players.length < 4) throw new Error("Add at least four players.");
  const names = configuration.players.map((player) => player.name.trim().toLocaleLowerCase());
  if (names.some((name) => !name)) throw new Error("Add a name for every player.");
  if (new Set(names).size !== names.length) throw new Error("Use a different name for each player.");
  if (configuration.courtCount < 1 || configuration.courtCount > Math.floor(configuration.players.length / 4)) {
    throw new Error("Add four players for every court in use.");
  }
  if (configuration.mode === "king_of_court" && configuration.players.length !== configuration.courtCount * 4) {
    throw new Error("Court Climb needs exactly four players per court.");
  }
  if ((configuration.mode === "round_robin" || configuration.fixedPairs.length) && configuration.players.length % 2) {
    throw new Error("Fixed pairs need an even number of players.");
  }
  if (configuration.mode === "round_robin" && configuration.fixedPairs.length < 2) {
    throw new Error("Team Round Robin needs at least two pairs.");
  }
  if (configuration.fixedPairs.length) {
    const assigned = configuration.fixedPairs.flat();
    if (assigned.length !== configuration.players.length || new Set(assigned).size !== assigned.length) {
      throw new Error("Assign every player to one pair.");
    }
  }
}

export function startQuickPlay(configuration: QuickPlayConfiguration): QuickPlaySession {
  validateConfiguration(configuration);
  return startNextQuickPlayMatches({
    ...configuration,
    players: configuration.players.map((player) => ({ ...player, name: player.name.trim() })),
    waitingPlayerIds: configuration.players.map((player) => player.id),
    activeMatches: [],
    completedMatches: [],
    nextMatchNumber: 1,
  });
}

export function startNextQuickPlayMatches(session: QuickPlaySession): QuickPlaySession {
  const plans = nextPlans(session);
  if (!plans.length) return session;
  const playing = new Set(plans.flatMap((plan) => [...plan.teamA, ...plan.teamB]));
  const activeMatches = plans.map<QuickPlayMatch>((plan, index) => ({
    id: `quick-match-${session.nextMatchNumber + index}`,
    courtId: plan.courtId,
    courtLabel: plan.courtLabel,
    teamA: plan.teamA,
    teamB: plan.teamB,
    scores: [0, 0],
    status: "active",
    winner: null,
    finishedAt: null,
  }));
  return {
    ...session,
    waitingPlayerIds: session.waitingPlayerIds.filter((id) => !playing.has(id)),
    activeMatches: [...session.activeMatches, ...activeMatches],
    nextMatchNumber: session.nextMatchNumber + activeMatches.length,
  };
}

export function canStartNextQuickPlayMatches(session: QuickPlaySession) {
  return nextPlans(session).length > 0;
}

export function scoreQuickPlayMatch(session: QuickPlaySession, matchId: string, side: 0 | 1, amount: -1 | 1) {
  return {
    ...session,
    activeMatches: session.activeMatches.map((match) => {
      if (match.id !== matchId) return match;
      const scores: [number, number] = [...match.scores];
      scores[side] = Math.min(99, Math.max(0, scores[side] + amount));
      return { ...match, scores };
    }),
  };
}

export function swapQuickPlayMatchSides(session: QuickPlaySession, matchId: string): QuickPlaySession {
  return {
    ...session,
    activeMatches: session.activeMatches.map((match) =>
      match.id === matchId
        ? { ...match, teamA: match.teamB, teamB: match.teamA, scores: [match.scores[1], match.scores[0]] }
        : match,
    ),
  };
}

export function finishQuickPlayMatch(session: QuickPlaySession, matchId: string): QuickPlaySession {
  const match = session.activeMatches.find((item) => item.id === matchId);
  if (!match) return session;
  if (match.scores[0] === match.scores[1]) throw new Error("Enter a winner before finishing the match.");
  const winner = match.scores[0] > match.scores[1] ? "A" : "B";
  const previous = session.completedMatches.findLast((item) => item.courtId === match.courtId);
  const finishPlan = planMatchFinish({
    mode: session.mode,
    queueRule: session.queueRule,
    waitingPlayerIds: session.waitingPlayerIds,
    teamA: match.teamA,
    teamB: match.teamB,
    winner,
    previousCourtPlayerIds: previous ? [...previous.teamA, ...previous.teamB] : null,
  });
  const remaining = session.waitingPlayerIds.filter((id) => !finishPlan.orderedPlayerIds.includes(id));
  const completed: QuickPlayMatch = {
    ...match,
    status: "completed",
    winner,
    finishedAt: session.completedMatches.length + 1,
  };
  return {
    ...session,
    waitingPlayerIds: [...finishPlan.orderedPlayerIds, ...remaining],
    activeMatches: session.activeMatches.filter((item) => item.id !== matchId),
    completedMatches: [...session.completedMatches, completed],
  };
}

export function quickPlayStandings(session: QuickPlaySession) {
  const names = new Map(session.players.map((player) => [player.id, player.name]));
  return calculateStandings(
    session.completedMatches.map((match) => ({
      teamA: match.teamA,
      teamB: match.teamB,
      scoreA: match.scores[0],
      scoreB: match.scores[1],
      status: "completed" as const,
    })),
  ).map((standing) => ({ ...standing, name: names.get(standing.playerId) ?? "Player" }));
}

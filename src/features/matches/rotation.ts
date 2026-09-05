import { z } from "zod";

import { courtLabel } from "./presentation";

export const queueRules = ["adaptive", "four_off", "winner_stays"] as const;
export type QueueRule = (typeof queueRules)[number];
export type PartnerPolicy = "mix" | "fixed";
export type FixedPair = [string, string];
export type PlayMode =
  | "queue"
  | "random"
  | "balanced"
  | "king_of_court"
  | "round_robin";
export type PlaySetup =
  | {
      mode: "queue";
      queueRule: QueueRule;
      partnerPolicy: PartnerPolicy;
      pairs: FixedPair[];
    }
  | { mode: "round_robin"; pairs: FixedPair[] }
  | { mode: "random" | "balanced" | "king_of_court" };

const pairSchema = z
  .tuple([z.string().uuid(), z.string().uuid()])
  .refine(
    ([first, second]) => first !== second,
    "A pair needs two different players"
  );
const setupSchema = z.object({
  mode: z.enum(["queue", "random", "balanced", "king_of_court", "round_robin"]),
  queueRule: z.enum(queueRules).optional(),
  partnerPolicy: z.enum(["mix", "fixed"]).optional(),
  pairs: z.array(pairSchema).optional(),
});

function validFixedPairs(pairs: FixedPair[]) {
  const players = pairs.flat();
  if (pairs.length < 2 || new Set(players).size !== players.length)
    throw new Error("Fixed pairs must assign every player once");
  return pairs;
}

export function parsePlaySetup(input: unknown): PlaySetup {
  const setup = setupSchema.parse(input);
  const pairs = setup.pairs ?? [];
  if (setup.mode === "queue") {
    const partnerPolicy = setup.partnerPolicy ?? "mix";
    return {
      mode: "queue",
      queueRule: setup.queueRule ?? "adaptive",
      partnerPolicy,
      pairs: partnerPolicy === "fixed" ? validFixedPairs(pairs) : [],
    };
  }
  if (setup.mode === "round_robin")
    return { mode: "round_robin", pairs: validFixedPairs(pairs) };
  return { mode: setup.mode };
}

export function queueRuleFromConfig(
  config: Record<string, unknown>
): QueueRule {
  const parsed = z.enum(queueRules).safeParse(config.queueRule);
  return parsed.success ? parsed.data : "adaptive";
}

export function rotationName(mode: string): string {
  if (mode === "random") return "Mix It Up";
  if (mode === "balanced") return "Balanced Mix";
  if (mode === "king_of_court") return "Court Climb";
  if (mode === "round_robin") return "Team Round Robin";
  return "Paddle Stack";
}

export function rotationDescription(
  mode: string,
  config: Record<string, unknown>
): string {
  if (mode === "random")
    return "Everyone rotates together with new partners and fair rests each round.";
  if (mode === "balanced")
    return "Fair rests come first, then self-described playing experience keeps each court close and social.";
  if (mode === "king_of_court")
    return "Winners move toward Court 1, losers move down, and partners split each round.";
  if (mode === "round_robin")
    return "Fixed pairs play every other pair once, with automatic byes when needed.";
  const rule = queueRuleFromConfig(config);
  const fixed = config.partnerPolicy === "fixed";
  if (fixed && rule === "four_off")
    return "Pairs stay together and both teams rotate off after every match.";
  if (fixed && rule === "winner_stays")
    return "Pairs stay together; winners stay for up to two matches and take the next pair.";
  if (fixed)
    return "Pairs stay together; winners stay with a short queue and both teams rotate when it gets busy.";
  if (rule === "four_off")
    return "All four players rotate off after every match. The longest-waiting four play next.";
  if (rule === "winner_stays")
    return "Winners stay for up to two matches, split sides, and take the next two players.";
  return "Winners stay and split with a short queue; all four rotate when the queue gets busy.";
}

export type RotationCourt = { id: string; label: string; position: number };
export type WaitingPlayer = {
  id: string;
  position: number;
  experience?: number;
};
export type RotationHistory = {
  courtId: string;
  courtPosition: number;
  teamA: string[];
  teamB: string[];
  winner: "A" | "B";
  finishedAt: number;
};
export type RotationPlan = {
  courtId: string;
  courtLabel: string;
  teamA: string[];
  teamB: string[];
};

export function planMatchFinish(input: {
  mode: string;
  queueRule: QueueRule;
  waitingPlayerIds: string[];
  teamA: string[];
  teamB: string[];
  winner: "A" | "B";
  previousCourtPlayerIds: string[] | null;
}) {
  const winners = input.winner === "A" ? input.teamA : input.teamB;
  const losers = input.winner === "A" ? input.teamB : input.teamA;
  const returnedPlayerIds = [...input.teamA, ...input.teamB];
  const winnerStaysRequested =
    input.mode === "queue" &&
    input.waitingPlayerIds.length >= 2 &&
    (input.queueRule === "winner_stays" ||
      (input.queueRule === "adaptive" && input.waitingPlayerIds.length < 4));
  const winnersStay =
    winnerStaysRequested &&
    input.previousCourtPlayerIds !== null &&
    !winners.every((id) => input.previousCourtPlayerIds!.includes(id));
  const orderedPlayerIds = winnersStay
    ? [...winners, ...input.waitingPlayerIds, ...losers]
    : [...input.waitingPlayerIds, ...returnedPlayerIds];

  return {
    winnersStay,
    returnedPlayerIds,
    orderedPlayerIds: [...new Set(orderedPlayerIds)],
  };
}

function partnershipCounts(history: RotationHistory[]) {
  const counts = new Map<string, number>();
  for (const match of history) {
    for (const team of [match.teamA, match.teamB]) {
      if (team.length !== 2) continue;
      const key = [...team].sort().join(":");
      counts.set(key, (counts.get(key) ?? 0) + 1);
    }
  }
  return counts;
}

function pairingOptions(players: string[]) {
  const [a, b, c, d] = players;
  return [
    { teamA: [a, b], teamB: [c, d] },
    { teamA: [a, c], teamB: [b, d] },
    { teamA: [a, d], teamB: [b, c] },
  ];
}

function pairFour(players: string[], history: RotationHistory[]) {
  const options = pairingOptions(players);
  const counts = partnershipCounts(history);
  const cost = ({ teamA, teamB }: { teamA: string[]; teamB: string[] }) =>
    [teamA, teamB].reduce(
      (total, team) => total + (counts.get([...team].sort().join(":")) ?? 0),
      0
    );
  return options.sort((left, right) => cost(left) - cost(right))[0];
}

function pairBalancedFour(
  players: WaitingPlayer[],
  history: RotationHistory[]
) {
  const experience = new Map(
    players.map((player) => [player.id, player.experience ?? 2.5])
  );
  const counts = partnershipCounts(history);
  const partnershipCost = ({
    teamA,
    teamB,
  }: {
    teamA: string[];
    teamB: string[];
  }) =>
    [teamA, teamB].reduce(
      (total, team) => total + (counts.get(pairKey(team)) ?? 0),
      0
    );
  const balanceCost = ({
    teamA,
    teamB,
  }: {
    teamA: string[];
    teamB: string[];
  }) =>
    Math.abs(
      teamA.reduce((total, id) => total + (experience.get(id) ?? 2.5), 0) -
        teamB.reduce((total, id) => total + (experience.get(id) ?? 2.5), 0)
    );
  return pairingOptions(players.map((player) => player.id)).sort(
    (left, right) =>
      balanceCost(left) - balanceCost(right) ||
      partnershipCost(left) - partnershipCost(right)
  )[0];
}

function encounterCounts(history: RotationHistory[]) {
  const counts = new Map<string, number>();
  for (const match of history) {
    const players = [...match.teamA, ...match.teamB];
    for (let left = 0; left < players.length; left += 1)
      for (let right = left + 1; right < players.length; right += 1) {
        const key = [players[left], players[right]].sort().join(":");
        counts.set(key, (counts.get(key) ?? 0) + 1);
      }
  }
  return counts;
}

function mixAcrossCourts(players: WaitingPlayer[], history: RotationHistory[]) {
  const encounters = encounterCounts(history);
  const remaining = [...players];
  const groups: WaitingPlayer[][] = [];
  while (remaining.length >= 4) {
    const group = [remaining.shift()!];
    while (group.length < 4) {
      const ranked = remaining
        .map((player, index) => ({
          player,
          index,
          cost: group.reduce(
            (sum, member) =>
              sum +
              (encounters.get([player.id, member.id].sort().join(":")) ?? 0),
            0
          ),
        }))
        .sort((a, b) => a.cost - b.cost || a.index - b.index);
      const next = ranked[0];
      group.push(next.player);
      remaining.splice(next.index, 1);
    }
    groups.push(group);
  }
  return groups;
}

function latestByCourt(history: RotationHistory[]) {
  const latest = new Map<number, RotationHistory>();
  for (const match of history) {
    const current = latest.get(match.courtPosition);
    if (!current || current.finishedAt < match.finishedAt)
      latest.set(match.courtPosition, match);
  }
  return latest;
}

function planCourtClimb(
  courts: RotationCourt[],
  waiting: WaitingPlayer[],
  history: RotationHistory[]
): RotationPlan[] {
  const eligible = new Set(waiting.map((player) => player.id));
  const latest = latestByCourt(history);
  if (history.length === 0)
    return courts.map((court, index) => {
      const group = waiting
        .slice(index * 4, index * 4 + 4)
        .map((player) => player.id);
      const teams = pairFour(group, history);
      return { courtId: court.id, courtLabel: court.label, ...teams };
    });
  if (latest.size < courts.length)
    throw new Error(
      "Finish a full Court Climb round before starting the next one."
    );

  const arrivals = new Map<number, string[][]>(
    courts.map((court) => [court.position, []])
  );
  for (const court of courts) {
    const match = latest.get(court.position)!;
    const winning = match.winner === "A" ? match.teamA : match.teamB;
    const losing = match.winner === "A" ? match.teamB : match.teamA;
    arrivals
      .get(Math.max(1, court.position - 1))
      ?.push(winning.filter((id) => eligible.has(id)));
    arrivals
      .get(Math.min(courts.length, court.position + 1))
      ?.push(losing.filter((id) => eligible.has(id)));
  }
  return courts.map((court) => {
    const pairs = arrivals.get(court.position) ?? [];
    if (pairs.length !== 2 || pairs.some((pair) => pair.length !== 2))
      throw new Error(
        "Court Climb needs the same four active players on every court."
      );
    return {
      courtId: court.id,
      courtLabel: court.label,
      teamA: [pairs[0][0], pairs[1][0]],
      teamB: [pairs[0][1], pairs[1][1]],
    };
  });
}

function availablePairs(fixedPairs: FixedPair[], waiting: WaitingPlayer[]) {
  const position = new Map(
    waiting.map((player) => [player.id, player.position])
  );
  return fixedPairs
    .filter(([first, second]) => position.has(first) && position.has(second))
    .toSorted(
      (left, right) =>
        Math.min(position.get(left[0])!, position.get(left[1])!) -
        Math.min(position.get(right[0])!, position.get(right[1])!)
    );
}

function pairKey(pair: string[]) {
  return [...pair].sort().join(":");
}

function matchupKey(first: string[], second: string[]) {
  return [pairKey(first), pairKey(second)].sort().join("|");
}

function roundRobinRounds(pairs: FixedPair[]) {
  const rotation: Array<FixedPair | null> = [...pairs];
  if (rotation.length % 2) rotation.push(null);
  const rounds: Array<Array<[FixedPair, FixedPair]>> = [];
  for (let round = 0; round < rotation.length - 1; round += 1) {
    const matchups: Array<[FixedPair, FixedPair]> = [];
    for (let index = 0; index < rotation.length / 2; index += 1) {
      const first = rotation[index];
      const second = rotation[rotation.length - 1 - index];
      if (first && second) matchups.push([first, second]);
    }
    rounds.push(matchups);
    rotation.splice(1, 0, rotation.pop()!);
  }
  return rounds;
}

function planTeamRoundRobin(
  courts: RotationCourt[],
  waiting: WaitingPlayer[],
  history: RotationHistory[],
  fixedPairs: FixedPair[]
) {
  const eligible = availablePairs(fixedPairs, waiting);
  const eligibleKeys = new Set(eligible.map(pairKey));
  const played = new Set(
    history.map((match) => matchupKey(match.teamA, match.teamB))
  );
  const round = roundRobinRounds(fixedPairs)
    .map((matchups) =>
      matchups.filter(
        ([first, second]) =>
          eligibleKeys.has(pairKey(first)) &&
          eligibleKeys.has(pairKey(second)) &&
          !played.has(matchupKey(first, second))
      )
    )
    .find((matchups) => matchups.length);
  if (!round) return [];
  return round.slice(0, courts.length).map(([teamA, teamB], index) => ({
    courtId: courts[index].id,
    courtLabel: courts[index].label,
    teamA: [...teamA],
    teamB: [...teamB],
  }));
}

export function planRotation(input: {
  mode: PlayMode;
  courts: RotationCourt[];
  waiting: WaitingPlayer[];
  history: RotationHistory[];
  fixedPairs?: FixedPair[];
}): RotationPlan[] {
  const courts = input.courts
    .map((court) => ({ ...court, label: courtLabel(court.position) }))
    .toSorted((a, b) => a.position - b.position);
  const waiting = input.waiting.toSorted((a, b) => a.position - b.position);
  if (waiting.length < 4 || courts.length === 0) return [];
  if (input.mode === "king_of_court")
    return planCourtClimb(courts, waiting, input.history);
  if (input.mode === "round_robin")
    return planTeamRoundRobin(
      courts,
      waiting,
      input.history,
      input.fixedPairs ?? []
    );
  if (input.mode === "queue") {
    const fixed = availablePairs(input.fixedPairs ?? [], waiting);
    if (fixed.length)
      return courts
        .slice(0, Math.floor(fixed.length / 2))
        .map((court, index) => ({
          courtId: court.id,
          courtLabel: court.label,
          teamA: [...fixed[index * 2]],
          teamB: [...fixed[index * 2 + 1]],
        }));
    return courts
      .slice(0, Math.floor(waiting.length / 4))
      .map((court, index) => {
        const group = waiting
          .slice(index * 4, index * 4 + 4)
          .map((player) => player.id);
        return {
          courtId: court.id,
          courtLabel: court.label,
          ...pairFour(group, input.history),
        };
      });
  }

  const games = new Map<string, number>();
  for (const match of input.history)
    for (const id of [...match.teamA, ...match.teamB])
      games.set(id, (games.get(id) ?? 0) + 1);
  const selected = waiting
    .toSorted(
      (a, b) =>
        (games.get(a.id) ?? 0) - (games.get(b.id) ?? 0) ||
        a.position - b.position
    )
    .slice(0, courts.length * 4);
  const groups = mixAcrossCourts(selected, input.history);
  return courts.slice(0, groups.length).map((court, index) => {
    const group = groups[index];
    const teams =
      input.mode === "balanced"
        ? pairBalancedFour(group, input.history)
        : pairFour(
            group.map((player) => player.id),
            input.history
          );
    return { courtId: court.id, courtLabel: court.label, ...teams };
  });
}

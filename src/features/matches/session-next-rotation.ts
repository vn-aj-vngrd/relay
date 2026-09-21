import { playingExperienceWeight } from "@/features/players/playing-experience";

import { previewNextRotation } from "./next-rotation";
import { type FixedPair, queueRuleFromConfig } from "./rotation";
import type { SessionPlayData } from "./session-play";

export function sessionNextRotation(data: SessionPlayData) {
  const positions = new Map(
    data.courts.map((court) => [court.id, court.position])
  );
  const storedMode = data.session.rotationMode;
  const mode =
    storedMode === "random" ||
    storedMode === "balanced" ||
    storedMode === "king_of_court" ||
    storedMode === "round_robin"
      ? storedMode
      : "queue";
  return previewNextRotation({
    mode,
    queueRule: queueRuleFromConfig(data.session.rotationConfig),
    courts: data.courts.filter((court) => court.availableForPlay),
    activeCourtIds: data.activeMatches.map((match) => match.courtId ?? ""),
    waiting: data.queue
      .filter(({ queue }) => queue.state === "waiting")
      .map(({ queue, player }) => ({
        id: player.id,
        position: queue.position,
        experience: playingExperienceWeight(player.skillLevel),
      })),
    fixedPairs: data.pairs.map((pair) => pair.members as FixedPair),
    history: data.completedMatches.map((match) => ({
      courtId: match.courtId ?? "",
      courtPosition: positions.get(match.courtId ?? "") ?? 0,
      teamA: match.teamAPlayerIds,
      teamB: match.teamBPlayerIds,
      winner: match.winningTeam === "B" ? "B" : "A",
      finishedAt: match.finishedAt?.getTime() ?? 0,
    })),
  });
}

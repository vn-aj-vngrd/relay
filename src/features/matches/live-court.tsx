"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import { SubmitButton } from "@/components/ui/submit-button";

import { finishMatch, saveScore } from "./actions";
import { CourtScoreboardCourt, type CourtScoreboardNavigation, type CourtScoreboardTeam } from "./court-scoreboard";

export type LiveCourtProps = {
  sessionId: string;
  matchId: string;
  number: string;
  teams: [string, string];
  scores: [number, number];
  version: number;
  canScore: boolean;
};

type ManagedLiveCourtProps = LiveCourtProps & {
  expanded?: boolean;
  onExpandedChange?: (expanded: boolean) => void;
  navigation?: CourtScoreboardNavigation;
};

function scoreboardTeam(name: string): CourtScoreboardTeam {
  return { label: name, players: name.split(" + ") };
}

function ManagedLiveCourt({
  sessionId,
  matchId,
  number,
  teams,
  scores,
  version,
  canScore,
  expanded,
  onExpandedChange,
  navigation,
}: ManagedLiveCourtProps) {
  const router = useRouter();
  const serverScoreA = scores[0];
  const serverScoreB = scores[1];
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const desiredRef = useRef<[number, number]>(scores);
  const versionRef = useRef(version);
  const dirtyRef = useRef(false);
  const savingRef = useRef(false);
  const [localScores, setLocalScores] = useState<[number, number]>(scores);
  const [scorePending, setScorePending] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (dirtyRef.current || savingRef.current) return;
    const next: [number, number] = [serverScoreA, serverScoreB];
    desiredRef.current = next;
    versionRef.current = version;
    setLocalScores(next);
  }, [serverScoreA, serverScoreB, version]);

  useEffect(
    () => () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    },
    [],
  );

  async function flushScore() {
    if (savingRef.current || !dirtyRef.current) return;
    savingRef.current = true;
    const savingScores: [number, number] = [...desiredRef.current];
    try {
      const saved = await saveScore({
        sessionId,
        matchId,
        teamAScore: savingScores[0],
        teamBScore: savingScores[1],
        version: versionRef.current,
      });
      versionRef.current = saved.version;
      setError("");
      if (desiredRef.current[0] !== savingScores[0] || desiredRef.current[1] !== savingScores[1]) {
        timerRef.current = setTimeout(() => void flushScore(), 120);
      } else {
        dirtyRef.current = false;
        setLocalScores([saved.teamAScore, saved.teamBScore]);
        setScorePending(false);
      }
    } catch {
      dirtyRef.current = false;
      setScorePending(false);
      setError("This score changed on another device. Relay is loading the latest version.");
      router.refresh();
    } finally {
      savingRef.current = false;
    }
  }

  function score(side: 0 | 1, amount: -1 | 1) {
    setLocalScores((current) => {
      const next: [number, number] = [...current];
      next[side] = Math.min(99, Math.max(0, next[side] + amount));
      desiredRef.current = next;
      return next;
    });
    dirtyRef.current = true;
    setScorePending(true);
    setError("");
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => void flushScore(), 420);
  }

  return (
    <CourtScoreboardCourt
      courtLabel={number}
      teams={[scoreboardTeam(teams[0]), scoreboardTeam(teams[1])]}
      scores={localScores}
      canScore={canScore}
      scorePending={scorePending}
      error={error}
      onScore={score}
      expanded={expanded}
      onExpandedChange={onExpandedChange}
      navigation={navigation}
      closeLabel="Close expanded scoreboard"
      keepExpandedContentMounted
      finishControl={
        canScore ? (
          <form noValidate action={finishMatch}>
            <input type="hidden" name="sessionId" value={sessionId} />
            <input type="hidden" name="matchId" value={matchId} />
            <SubmitButton
              pendingLabel="Finishing match…"
              variant="secondary"
              className="w-full"
              disabled={localScores[0] === localScores[1] || scorePending}
            >
              Finish match
            </SubmitButton>
          </form>
        ) : undefined
      }
    />
  );
}

export function LiveCourt(props: LiveCourtProps) {
  return <ManagedLiveCourt {...props} />;
}

export function LiveCourtDeck({ courts }: { courts: LiveCourtProps[] }) {
  const [selectedMatchId, setSelectedMatchId] = useState<string | null>(null);
  const selectedIndex = courts.findIndex((court) => court.matchId === selectedMatchId);

  return (
    <div className="grid gap-5">
      {courts.map((court, index) => {
        const previous = courts[(index - 1 + courts.length) % courts.length];
        const next = courts[(index + 1) % courts.length];
        return (
          <ManagedLiveCourt
            key={court.matchId}
            {...court}
            expanded={selectedIndex === index}
            onExpandedChange={(nextExpanded) => setSelectedMatchId(nextExpanded ? court.matchId : null)}
            navigation={
              courts.length > 1
                ? {
                    position: index + 1,
                    total: courts.length,
                    previousLabel: previous.number,
                    nextLabel: next.number,
                    onPrevious: () => setSelectedMatchId(previous.matchId),
                    onNext: () => setSelectedMatchId(next.matchId),
                  }
                : undefined
            }
          />
        );
      })}
    </div>
  );
}

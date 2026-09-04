"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import { ConfirmSubmitButton } from "@/components/shared/confirm-submit-button";

import { finishMatch, saveScore } from "./actions";
import {
  CourtScoreboardCourt,
  type CourtScoreboardNavigation,
  type CourtScoreboardTeam,
} from "./court-scoreboard";

export type LiveCourtProps = {
  sessionId: string;
  matchId: string;
  number: string;
  teams: [string, string];
  scores: [number, number];
  version: number;
  canScore: boolean;
};

type PendingScore = {
  scores: [number, number];
  version: number;
};

type ManagedLiveCourtProps = LiveCourtProps & {
  expanded?: boolean;
  onExpandedChange?: (expanded: boolean) => void;
  navigation?: CourtScoreboardNavigation;
};

function scoreboardTeam(name: string): CourtScoreboardTeam {
  return { label: name, players: name.split(" + ") };
}

function pendingScoreKey(sessionId: string, matchId: string) {
  return `relay-pending-score:${sessionId}:${matchId}`;
}

function readPendingScore(key: string): PendingScore | null {
  try {
    const value = localStorage.getItem(key);
    if (!value) return null;
    const parsed: unknown = JSON.parse(value);
    if (
      !parsed ||
      typeof parsed !== "object" ||
      !("scores" in parsed) ||
      !("version" in parsed) ||
      !Array.isArray(parsed.scores) ||
      parsed.scores.length !== 2 ||
      parsed.scores.some(
        (score) => !Number.isInteger(score) || score < 0 || score > 99
      ) ||
      !Number.isInteger(parsed.version)
    )
      return null;
    return parsed as PendingScore;
  } catch {
    return null;
  }
}

function writePendingScore(key: string, value: PendingScore | null) {
  try {
    if (value) localStorage.setItem(key, JSON.stringify(value));
    else localStorage.removeItem(key);
  } catch {
    // Scoring still works when browser storage is unavailable.
  }
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
  const flushScoreRef = useRef<() => void>(() => undefined);
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
      if ("conflict" in saved) {
        const latestScores: [number, number] = [
          saved.teamAScore,
          saved.teamBScore,
        ];
        desiredRef.current = latestScores;
        dirtyRef.current = false;
        writePendingScore(pendingScoreKey(sessionId, matchId), null);
        setLocalScores(latestScores);
        setScorePending(false);
        setError(
          `Latest score is ${saved.teamAScore}–${saved.teamBScore}. Your ${savingScores[0]}–${savingScores[1]} change wasn’t saved; use the score controls to retry.`
        );
        router.refresh();
      } else if (
        desiredRef.current[0] !== savingScores[0] ||
        desiredRef.current[1] !== savingScores[1]
      ) {
        setError("");
        writePendingScore(pendingScoreKey(sessionId, matchId), {
          scores: desiredRef.current,
          version: versionRef.current,
        });
        timerRef.current = setTimeout(() => void flushScore(), 120);
      } else {
        dirtyRef.current = false;
        writePendingScore(pendingScoreKey(sessionId, matchId), null);
        setLocalScores([saved.teamAScore, saved.teamBScore]);
        setScorePending(false);
        setError("");
      }
    } catch {
      dirtyRef.current = false;
      setScorePending(false);
      setError(
        "This score couldn’t be saved. Relay is loading the latest score; use the controls to retry."
      );
      router.refresh();
    } finally {
      savingRef.current = false;
    }
  }

  flushScoreRef.current = () => void flushScore();

  useEffect(() => {
    const key = pendingScoreKey(sessionId, matchId);
    const pending = readPendingScore(key);
    if (pending?.version === versionRef.current) {
      desiredRef.current = pending.scores;
      dirtyRef.current = true;
      setLocalScores(pending.scores);
      setScorePending(true);
      flushScoreRef.current();
    } else if (pending) writePendingScore(key, null);

    function flush() {
      flushScoreRef.current();
    }

    function flushWhenHidden() {
      if (document.visibilityState === "hidden") flush();
    }

    window.addEventListener("pagehide", flush);
    document.addEventListener("visibilitychange", flushWhenHidden);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      window.removeEventListener("pagehide", flush);
      document.removeEventListener("visibilitychange", flushWhenHidden);
      flush();
    };
  }, [matchId, sessionId]);

  function score(side: 0 | 1, amount: -1 | 1) {
    const next: [number, number] = [...desiredRef.current];
    next[side] = Math.min(99, Math.max(0, next[side] + amount));
    desiredRef.current = next;
    setLocalScores(next);
    dirtyRef.current = true;
    writePendingScore(pendingScoreKey(sessionId, matchId), {
      scores: next,
      version: versionRef.current,
    });
    setScorePending(true);
    setError("");
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => flushScoreRef.current(), 420);
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
            <ConfirmSubmitButton
              pendingLabel="Finishing match…"
              variant="secondary"
              className="w-full"
              disabled={localScores[0] === localScores[1] || scorePending}
              confirmTitle={`Finish ${number} at ${localScores[0]}–${localScores[1]}?`}
              confirmText={`${teams[0]} ${localScores[0]}, ${teams[1]} ${localScores[1]}. Confirming advances the court rotation.`}
              confirmLabel="Finish match"
            >
              Finish match
            </ConfirmSubmitButton>
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
  const selectedIndex = courts.findIndex(
    (court) => court.matchId === selectedMatchId
  );

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
            onExpandedChange={(nextExpanded) =>
              setSelectedMatchId(nextExpanded ? court.matchId : null)
            }
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

"use client";

import { PencilSimple } from "@phosphor-icons/react";
import { useActionState, useEffect, useId, useRef } from "react";

import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { SubmitButton } from "@/components/ui/submit-button";

import { correctCompletedScore } from "./actions";

export type CompletedMatchResult = {
  id: string;
  courtLabel: string;
  teams: [string, string];
  scores: [number, number];
  version: number;
};

function ScoreCorrectionControl({
  sessionId,
  result,
}: {
  sessionId: string;
  result: CompletedMatchResult;
}) {
  const [state, action] = useActionState(correctCompletedScore, {});
  const dialogRef = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const descriptionId = useId();

  useEffect(() => {
    if (state.success) dialogRef.current?.close();
  }, [state.success]);

  return (
    <>
      <Button
        type="button"
        variant="quiet"
        className="shrink-0"
        aria-label={`Correct ${result.courtLabel} score`}
        onClick={() => dialogRef.current?.showModal()}
      >
        <PencilSimple aria-hidden size={15} />
        Correct
      </Button>
      {state.success ? (
        <span role="status" className="sr-only">
          {state.success}
        </span>
      ) : null}
      <Dialog
        ref={dialogRef}
        aria-labelledby={titleId}
        aria-describedby={descriptionId}
      >
        <form noValidate action={action} className="p-5 sm:p-6">
          <input type="hidden" name="sessionId" value={sessionId} />
          <input type="hidden" name="matchId" value={result.id} />
          <input type="hidden" name="version" value={result.version} />
          <h2 id={titleId} className="text-lg font-[680]">
            Correct {result.courtLabel} score
          </h2>
          <p id={descriptionId} className="mt-2 text-sm leading-6 text-muted">
            This updates the result, standings, and recap. Later court
            assignments stay as played.
          </p>
          <div className="mt-6 grid grid-cols-[1fr_5.5rem] items-center gap-x-4 gap-y-4">
            <label
              htmlFor={`${titleId}-a`}
              className="min-w-0 text-sm font-semibold"
            >
              <span className="line-clamp-2">{result.teams[0]}</span>
            </label>
            <input
              id={`${titleId}-a`}
              name="teamAScore"
              type="number"
              inputMode="numeric"
              min={0}
              max={99}
              required
              defaultValue={result.scores[0]}
              className="field score text-center text-lg"
            />
            <label
              htmlFor={`${titleId}-b`}
              className="min-w-0 text-sm font-semibold"
            >
              <span className="line-clamp-2">{result.teams[1]}</span>
            </label>
            <input
              id={`${titleId}-b`}
              name="teamBScore"
              type="number"
              inputMode="numeric"
              min={0}
              max={99}
              required
              defaultValue={result.scores[1]}
              className="field score text-center text-lg"
            />
          </div>
          {state.error ? (
            <p role="alert" className="mt-4 text-sm font-medium text-danger">
              {state.error}
            </p>
          ) : null}
          <div className="mt-7 flex justify-end gap-2">
            <Button
              type="button"
              variant="secondary"
              onClick={() => dialogRef.current?.close()}
            >
              Cancel
            </Button>
            <SubmitButton pendingLabel="Saving correction…">
              Save correction
            </SubmitButton>
          </div>
        </form>
      </Dialog>
    </>
  );
}

export function MatchResults({
  sessionId,
  results,
  canCorrect = false,
  heading = "Completed matches",
}: {
  sessionId: string;
  results: CompletedMatchResult[];
  canCorrect?: boolean;
  heading?: string;
}) {
  if (!results.length) return null;

  return (
    <section aria-labelledby={`match-results-${sessionId}`}>
      <div>
        <h2 id={`match-results-${sessionId}`} className="text-xl font-bold">
          {heading}
        </h2>
        <p className="mt-1 text-sm text-muted">
          Final scores from this game
          {canCorrect ? " · corrections are recorded in Chat" : ""}.
        </p>
      </div>
      <ol className="mt-4 divide-y divide-line border-y border-line">
        {results.map((result) => (
          <li
            key={result.id}
            className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 py-4"
          >
            <div className="min-w-0">
              <p className="text-xs font-semibold text-muted">
                {result.courtLabel}
              </p>
              <div className="mt-2 grid grid-cols-[minmax(0,1fr)_auto] gap-x-3 gap-y-1 text-sm">
                <span className="truncate font-medium">{result.teams[0]}</span>
                <strong className="score text-base">{result.scores[0]}</strong>
                <span className="truncate font-medium">{result.teams[1]}</span>
                <strong className="score text-base">{result.scores[1]}</strong>
              </div>
            </div>
            {canCorrect ? (
              <ScoreCorrectionControl
                key={`${result.id}:${result.version}`}
                sessionId={sessionId}
                result={result}
              />
            ) : null}
          </li>
        ))}
      </ol>
    </section>
  );
}

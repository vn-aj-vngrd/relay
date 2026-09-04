"use client";

import { Warning } from "@phosphor-icons/react";
import { useActionState, useEffect, useId, useRef } from "react";

import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { SelectField } from "@/components/ui/select-field";
import { SubmitButton } from "@/components/ui/submit-button";

import { type CancelSessionState, cancelSessionAction } from "./cancel-session";

const reasons = [
  { value: "court_unavailable", label: "Court or venue unavailable" },
  { value: "weather", label: "Weather" },
  { value: "not_enough_players", label: "Not enough players" },
  { value: "schedule_conflict", label: "Schedule conflict" },
  { value: "host_unavailable", label: "Host unavailable" },
  { value: "other", label: "Other" },
];

export function CancelSessionControl({
  sessionId,
  version,
  playerCount,
}: {
  sessionId: string;
  version: number;
  playerCount: number;
}) {
  const [state, action, pending] = useActionState<CancelSessionState, FormData>(
    cancelSessionAction,
    {}
  );
  const dialogRef = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const descriptionId = useId();

  useEffect(() => {
    if (state.success) dialogRef.current?.close();
  }, [state.success]);

  return (
    <section
      className="mt-10 border-t border-line pt-7"
      aria-labelledby="cancel-game-title"
    >
      <h2 id="cancel-game-title" className="text-lg font-bold">
        Cancel game
      </h2>
      <p className="mt-1 max-w-2xl text-sm leading-6 text-muted">
        Use cancellation when a published game will not go ahead. The plan and
        reason remain available to the roster.
      </p>
      <Button
        type="button"
        variant="danger"
        className="mt-4"
        onClick={() => dialogRef.current?.showModal()}
      >
        Cancel game
      </Button>
      {state.success ? (
        <p role="status" className="mt-3 text-sm font-medium text-primary">
          {state.success}
        </p>
      ) : null}
      <Dialog
        ref={dialogRef}
        aria-labelledby={titleId}
        aria-describedby={descriptionId}
      >
        <form noValidate action={action} className="p-5 sm:p-6">
          <input type="hidden" name="sessionId" value={sessionId} />
          <input type="hidden" name="version" value={version} />
          <div className="flex items-start gap-3">
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-danger/10 text-danger">
              <Warning aria-hidden size={19} weight="fill" />
            </span>
            <div>
              <h2 id={titleId} className="text-lg font-[680]">
                Cancel this game?
              </h2>
              <p
                id={descriptionId}
                className="mt-2 text-sm leading-6 text-muted"
              >
                {playerCount} {playerCount === 1 ? "person" : "people"} on the
                roster will see the reason. Joining and game activity will
                close, while payment records remain available for coordination.
              </p>
            </div>
          </div>
          <div className="mt-5">
            <SelectField
              id="cancellation-category"
              name="category"
              label="Why is the game cancelled?"
              defaultValue="court_unavailable"
              options={reasons}
            />
          </div>
          <div className="mt-5">
            <label
              htmlFor="cancellation-reason"
              className="text-sm font-semibold"
            >
              Note for players{" "}
              <span className="font-normal text-muted">
                (optional unless Other)
              </span>
            </label>
            <textarea
              id="cancellation-reason"
              name="reason"
              rows={3}
              maxLength={240}
              className="mt-2 w-full resize-y rounded-lg border border-line bg-surface px-3 py-2 text-base text-ink outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
              placeholder="The venue let us know the court is no longer available."
            />
          </div>
          {state.error ? (
            <p role="alert" className="mt-3 text-sm text-danger">
              {state.error}
            </p>
          ) : null}
          <div className="mt-6 flex justify-end gap-2">
            <Button
              type="button"
              variant="secondary"
              onClick={() => dialogRef.current?.close()}
              disabled={pending}
            >
              Keep game
            </Button>
            <SubmitButton pendingLabel="Cancelling…" variant="danger">
              Cancel and notify
            </SubmitButton>
          </div>
        </form>
      </Dialog>
    </section>
  );
}

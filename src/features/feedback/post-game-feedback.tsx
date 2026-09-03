"use client";

import { CheckCircle, Smiley, WarningCircle, X } from "@phosphor-icons/react";
import { useActionState } from "react";

import { ButtonLink } from "@/components/ui/button";
import { PendingSubmit } from "@/components/ui/pending-submit";
import { SubmitButton } from "@/components/ui/submit-button";

import {
  dismissPostGameFeedback,
  type FeedbackActionState,
  recordSmoothGameFeedback,
} from "./actions";

export function PostGameFeedback({
  sessionId,
  issueHref,
}: {
  sessionId: string;
  issueHref: string;
}) {
  const [state, action] = useActionState<FeedbackActionState, FormData>(
    recordSmoothGameFeedback,
    {}
  );

  if (state.success)
    return (
      <section
        className="border-y border-line py-5"
        aria-label="Game feedback received"
      >
        <div className="flex items-start gap-3">
          <CheckCircle
            aria-hidden
            size={20}
            weight="fill"
            className="mt-0.5 shrink-0 text-success"
          />
          <div>
            <p className="font-semibold">Thanks for checking in.</p>
            <p className="mt-1 text-sm leading-6 text-muted">
              Keep the crew moving with the next actions below.
            </p>
          </div>
        </div>
      </section>
    );

  return (
    <section
      className="relative border-y border-line py-6 pr-10"
      aria-labelledby="post-game-feedback-title"
    >
      <form
        noValidate
        action={dismissPostGameFeedback}
        className="absolute right-0 top-4"
      >
        <input type="hidden" name="sessionId" value={sessionId} />
        <PendingSubmit
          pendingLabel="Closing…"
          aria-label="Dismiss game feedback"
          className="pressable grid h-9 w-9 place-items-center rounded-lg text-muted hover:bg-surface-strong hover:text-ink"
        >
          <X aria-hidden size={17} />
        </PendingSubmit>
      </form>
      <h2 id="post-game-feedback-title" className="text-lg font-bold">
        How did this game go?
      </h2>
      <p className="mt-1 max-w-xl text-sm leading-6 text-muted">
        One quick answer helps Relay focus on what makes real game nights
        easier.
      </p>
      <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
        <form noValidate action={action}>
          <input type="hidden" name="sessionId" value={sessionId} />
          <SubmitButton
            pendingLabel="Saving…"
            variant="secondary"
            className="w-full sm:w-auto"
          >
            <Smiley aria-hidden size={17} /> Smooth
          </SubmitButton>
        </form>
        <ButtonLink
          href={issueHref}
          variant="quiet"
          className="w-full sm:w-auto"
        >
          <WarningCircle aria-hidden size={17} /> Had some issues
        </ButtonLink>
      </div>
      {state.error ? (
        <p role="alert" className="mt-3 text-sm font-medium text-danger">
          {state.error}
        </p>
      ) : null}
    </section>
  );
}

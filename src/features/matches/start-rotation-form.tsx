"use client";

import { Shuffle } from "@phosphor-icons/react";
import { useActionState } from "react";

import { SubmitButton } from "@/components/ui/submit-button";

import { createQueueMatch } from "./actions";

export function StartRotationForm({
  sessionId,
  label,
  pendingLabel,
  secondary = false,
}: {
  sessionId: string;
  label: string;
  pendingLabel: string;
  secondary?: boolean;
}) {
  const [state, action] = useActionState(createQueueMatch, {});

  return (
    <form noValidate action={action}>
      <input type="hidden" name="sessionId" value={sessionId} />
      <SubmitButton
        pendingLabel={pendingLabel}
        variant={secondary ? "secondary" : "primary"}
        className={secondary ? "whitespace-nowrap" : undefined}
      >
        <Shuffle aria-hidden size={17} />
        {label}
      </SubmitButton>
      {state.error ? (
        <p role="alert" className="mt-3 max-w-sm text-sm text-danger">
          {state.error}
        </p>
      ) : null}
    </form>
  );
}

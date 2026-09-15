"use client";
import { useActionState } from "react";
import { ActionNotice } from "@/components/ui/action-notice";
import { SubmitButton } from "@/components/ui/submit-button";
import { testAgentConnection } from "./connection-action";

export function AgentConnectionForm() {
  const [state, action] = useActionState(testAgentConnection, {});
  return (
    <form noValidate action={action} className="mt-4 border-t border-line pt-4">
      <SubmitButton pendingLabel="Testing connection…" variant="secondary">
        Test saved connection
      </SubmitButton>
      <p className="mt-2 text-xs leading-5 text-muted">
        Uses the saved key and model for a small synthetic request. OpenRouter
        may charge for it; no game data is sent and no Agent messages are
        deducted.
      </p>
      {state.success ? (
        <ActionNotice
          message={state.success}
          response={state}
          variant="success"
        />
      ) : null}
      {state.error ? (
        <ActionNotice message={state.error} response={state} />
      ) : null}
    </form>
  );
}

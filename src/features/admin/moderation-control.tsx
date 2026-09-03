"use client";

import { PauseCircle, Prohibit, ShieldCheck, Warning } from "@phosphor-icons/react";
import { useActionState, useEffect, useRef } from "react";
import { useFormStatus } from "react-dom";

import { Button, ButtonSpinner } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { usePreserveFormValuesOnError } from "@/components/ui/use-preserve-form-values";

import { type AdminActionState, cancelSessionAction, restoreUserAction, suspendUserAction } from "./actions";

type Mode = "suspend-user" | "restore-user" | "cancel-session";

const copy = {
  "suspend-user": {
    title: "Suspend this account?",
    description:
      "The person will be signed out and unable to use authenticated Relay features until an administrator restores access.",
    trigger: "Suspend account",
    submit: "Suspend account",
    pending: "Suspending…",
    field: "userId",
  },
  "restore-user": {
    title: "Restore this account?",
    description:
      "The person will be able to sign in and use Relay again. Their existing games and history stay intact.",
    trigger: "Restore account",
    submit: "Restore account",
    pending: "Restoring…",
    field: "userId",
  },
  "cancel-session": {
    title: "Cancel this game?",
    description:
      "The game remains in history for support and audit purposes, but participants will see it as cancelled.",
    trigger: "Cancel game",
    submit: "Cancel game",
    pending: "Cancelling…",
    field: "sessionId",
  },
} as const;

function SubmitButton({ mode }: { mode: Mode }) {
  const { pending } = useFormStatus();
  const restore = mode === "restore-user";
  return (
    <Button type="submit" variant={restore ? "primary" : "danger"} disabled={pending}>
      {pending ? (
        <>
          <ButtonSpinner />
          {copy[mode].pending}
        </>
      ) : (
        copy[mode].submit
      )}
    </Button>
  );
}

export function ModerationControl({ mode, targetId }: { mode: Mode; targetId: string }) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const action =
    mode === "suspend-user" ? suspendUserAction : mode === "restore-user" ? restoreUserAction : cancelSessionAction;
  const [state, formAction] = useActionState<AdminActionState, FormData>(action, {});
  const preserveValues = usePreserveFormValuesOnError(state);
  const details = copy[mode];
  const restore = mode === "restore-user";

  useEffect(() => {
    if (state.success) dialogRef.current?.close();
  }, [state]);

  const Icon = restore ? ShieldCheck : mode === "cancel-session" ? Prohibit : PauseCircle;

  return (
    <div>
      <Button
        type="button"
        variant={restore ? "primary" : "secondary"}
        className={!restore ? "text-danger" : ""}
        onClick={() => dialogRef.current?.showModal()}
      >
        <Icon aria-hidden size={17} />
        {details.trigger}
      </Button>
      <Dialog ref={dialogRef}>
        <form noValidate action={formAction} onSubmitCapture={preserveValues} className="p-5 sm:p-6">
          <input type="hidden" name={details.field} value={targetId} />
          <div className="flex items-start gap-3">
            <span
              className={`grid h-9 w-9 shrink-0 place-items-center rounded-full ${restore ? "bg-success/12 text-success" : "bg-danger/10 text-danger"}`}
            >
              <Warning aria-hidden size={19} weight="fill" />
            </span>
            <div>
              <h2 className="text-lg font-[680]">{details.title}</h2>
              <p className="mt-2 text-sm leading-6 text-muted">{details.description}</p>
            </div>
          </div>
          <div className="mt-6">
            <label htmlFor={`${mode}-reason`} className="text-sm font-semibold">
              Reason
            </label>
            <textarea
              id={`${mode}-reason`}
              name="reason"
              required
              minLength={5}
              maxLength={240}
              rows={3}
              className="mt-2 w-full resize-none rounded-lg border border-line bg-surface px-3.5 py-3 text-sm text-ink outline-none focus:border-primary focus:ring-3 focus:ring-primary/15"
              placeholder="Add context for the audit trail"
            />
            {state.error ? (
              <p role="alert" className="mt-2 text-sm font-medium text-danger">
                {state.error}
              </p>
            ) : null}
          </div>
          <div className="mt-7 flex justify-end gap-2">
            <Button type="button" variant="secondary" onClick={() => dialogRef.current?.close()}>
              Keep unchanged
            </Button>
            <SubmitButton mode={mode} />
          </div>
        </form>
      </Dialog>
      {state.success ? (
        <p role="status" className="mt-2 text-sm font-medium text-success">
          {state.success}
        </p>
      ) : null}
    </div>
  );
}

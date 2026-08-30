"use client";

import { ArrowCounterClockwise, Compass } from "@phosphor-icons/react";
import { useActionState, useEffect, useRef } from "react";
import { useFormStatus } from "react-dom";

import { Button, ButtonSpinner } from "@/components/ui/button";

import { type AdminActionState, resetUserOnboardingAction } from "./actions";

function ResetButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending ? (
        <>
          <ButtonSpinner />
          Resetting…
        </>
      ) : (
        "Onboard again"
      )}
    </Button>
  );
}

export function OnboardingResetControl({ targetId, queued }: { targetId: string; queued: boolean }) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [state, action] = useActionState<AdminActionState, FormData>(resetUserOnboardingAction, {});

  useEffect(() => {
    if (state.success) dialogRef.current?.close();
  }, [state]);

  return (
    <div>
      <Button type="button" variant="secondary" disabled={queued} onClick={() => dialogRef.current?.showModal()}>
        <ArrowCounterClockwise aria-hidden size={16} />
        {queued ? "Onboarding queued" : "Onboard again"}
      </Button>
      <dialog
        ref={dialogRef}
        className="m-auto w-[calc(100%_-_2rem)] max-w-md rounded-xl border border-line bg-surface p-0 text-ink shadow-[0_8px_8px_oklch(0.1_0.01_275/.18)] backdrop:bg-black/45"
      >
        <form action={action} className="p-5 sm:p-6">
          <input type="hidden" name="userId" value={targetId} />
          <div className="flex items-start gap-3">
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-primary-soft text-primary">
              <Compass aria-hidden size={19} weight="fill" />
            </span>
            <div>
              <h2 className="text-lg font-[680]">Onboard this user again?</h2>
              <p className="mt-2 text-sm leading-6 text-muted">
                Relay will show profile setup and the product tour the next time they open the app. Their profile,
                games, and existing answers stay intact.
              </p>
            </div>
          </div>
          {state.error ? (
            <p role="alert" className="mt-4 text-sm font-medium text-danger">
              {state.error}
            </p>
          ) : null}
          <div className="mt-7 flex justify-end gap-2">
            <Button type="button" variant="secondary" onClick={() => dialogRef.current?.close()}>
              Keep completed
            </Button>
            <ResetButton />
          </div>
        </form>
      </dialog>
      {state.success ? (
        <p role="status" className="mt-2 text-sm font-medium text-success">
          {state.success}
        </p>
      ) : null}
    </div>
  );
}

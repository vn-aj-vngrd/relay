"use client";

import { Check, Copy, Key, Warning } from "@phosphor-icons/react";
import { useActionState, useRef, useState } from "react";
import { useFormStatus } from "react-dom";

import { Alert } from "@/components/ui/alert";
import { Button, ButtonSpinner } from "@/components/ui/button";
import { usePreserveFormValuesOnError } from "@/components/ui/use-preserve-form-values";

import { type AdminActionState, resetUserPasswordAction } from "./actions";

function ResetButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" variant="danger" disabled={pending}>
      {pending ? (
        <>
          <ButtonSpinner />
          Creating temporary password…
        </>
      ) : (
        "Reset password"
      )}
    </Button>
  );
}

export function PasswordResetControl({ targetId, email }: { targetId: string; email: string }) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [state, action] = useActionState<AdminActionState, FormData>(resetUserPasswordAction, {});
  const [copied, setCopied] = useState(false);
  const preserveValues = usePreserveFormValuesOnError(state);

  if (state.temporaryPassword && state.accountEmail) {
    const credentials = `Email: ${state.accountEmail}\nTemporary password: ${state.temporaryPassword}`;
    return (
      <div>
        <Alert variant="success">{state.success}</Alert>
        <p className="mt-3 text-sm leading-6 text-muted">
          Share this privately. It is shown once. The player signs in with it, verifies their existing authenticator,
          then chooses a new password.
        </p>
        <dl className="mt-4 divide-y divide-line rounded-lg bg-surface-strong px-4">
          <div className="py-3">
            <dt className="text-xs font-semibold text-muted">Account</dt>
            <dd className="mt-1 break-all text-sm font-medium">{state.accountEmail}</dd>
          </div>
          <div className="py-3">
            <dt className="text-xs font-semibold text-muted">Temporary password</dt>
            <dd className="score mt-1 break-all text-sm font-bold">{state.temporaryPassword}</dd>
          </div>
        </dl>
        <Button
          type="button"
          variant="secondary"
          className="mt-4"
          onClick={async () => {
            await navigator.clipboard.writeText(credentials);
            setCopied(true);
          }}
        >
          {copied ? <Check aria-hidden size={17} /> : <Copy aria-hidden size={17} />}
          {copied ? "Copied" : "Copy credentials"}
        </Button>
      </div>
    );
  }

  return (
    <div>
      <Button type="button" variant="secondary" onClick={() => dialogRef.current?.showModal()}>
        <Key aria-hidden size={17} />
        Reset password
      </Button>
      <dialog
        ref={dialogRef}
        className="m-auto w-[calc(100%_-_2rem)] max-w-md rounded-xl border border-line bg-surface p-0 text-ink shadow-[0_8px_8px_oklch(0.1_0.01_275/.18)] backdrop:bg-black/45"
      >
        <form noValidate action={action} onSubmitCapture={preserveValues} className="p-5 sm:p-6">
          <input type="hidden" name="userId" value={targetId} />
          <div className="flex items-start gap-3">
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-danger/10 text-danger">
              <Warning aria-hidden size={19} weight="fill" />
            </span>
            <div>
              <h2 className="text-lg font-[680]">Reset this password?</h2>
              <p className="mt-2 text-sm leading-6 text-muted">
                Relay will replace the password for {email} and show a one-time temporary password. Existing
                authenticator factors stay connected and are still required.
              </p>
            </div>
          </div>
          {state.error ? <Alert className="mt-5">{state.error}</Alert> : null}
          <div className="mt-5">
            <label htmlFor="password-reset-reason" className="text-sm font-semibold">
              Reason
            </label>
            <textarea
              id="password-reset-reason"
              name="reason"
              required
              minLength={5}
              maxLength={240}
              rows={3}
              className="mt-2 w-full resize-none rounded-lg border border-line bg-surface px-3.5 py-3 text-sm text-ink outline-none focus:border-primary focus:ring-3 focus:ring-primary/15"
              placeholder="Add context for the audit trail"
            />
          </div>
          <div className="mt-7 flex justify-end gap-2">
            <Button type="button" variant="secondary" onClick={() => dialogRef.current?.close()}>
              Keep unchanged
            </Button>
            <ResetButton />
          </div>
        </form>
      </dialog>
    </div>
  );
}

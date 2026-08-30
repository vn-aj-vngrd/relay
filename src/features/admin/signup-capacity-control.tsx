"use client";

import { useActionState } from "react";

import { PendingSubmit } from "@/components/ui/pending-submit";

import { type AdminActionState, updateSignupCapacityAction } from "./actions";

export function SignupCapacityControl({ accountCap, userCount }: { accountCap: number; userCount: number }) {
  const [state, action] = useActionState<AdminActionState, FormData>(updateSignupCapacityAction, {});
  const remaining = Math.max(0, accountCap - userCount);
  const full = remaining === 0;

  return (
    <section aria-labelledby="signup-capacity-title" className="border-y border-line py-6">
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(18rem,24rem)] lg:items-end">
        <div>
          <h2 id="signup-capacity-title" className="text-lg font-bold">
            Signup capacity
          </h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-muted">
            Relay rejects new account creation once registered accounts reach this limit. Existing accounts can still
            sign in.
          </p>
          <p className={`mt-3 text-sm font-semibold ${full ? "text-danger" : "text-ink"}`}>
            {full ? "Signup is full" : `${remaining.toLocaleString()} places remaining`}
          </p>
          <p className="mt-1 text-xs text-muted">
            {userCount.toLocaleString()} registered of {accountCap.toLocaleString()} allowed
          </p>
        </div>

        <form action={action} className="min-w-0">
          <label htmlFor="signup-account-cap" className="text-sm font-semibold">
            Maximum accounts
          </label>
          <div className="mt-2 flex flex-col gap-2 sm:flex-row">
            <input
              id="signup-account-cap"
              name="accountCap"
              type="number"
              inputMode="numeric"
              min={1}
              max={50_000}
              step={1}
              required
              defaultValue={accountCap}
              aria-describedby="signup-account-cap-hint"
              className="field mt-0 min-w-0 flex-1 tabular-nums"
            />
            <PendingSubmit
              type="submit"
              pendingLabel="Saving…"
              className="pressable inline-flex min-h-11 items-center justify-center gap-1.5 rounded-lg border border-transparent bg-primary px-3 text-[13px] font-semibold leading-none text-white shadow-[inset_0_1px_0_oklch(1_0_0/.22)] hover:bg-primary-hover disabled:pointer-events-none disabled:opacity-45"
            >
              Save account limit
            </PendingSubmit>
          </div>
          <p id="signup-account-cap-hint" className="mt-2 text-xs leading-5 text-muted">
            Lowering the limit below the current total closes signup immediately. The limit includes admin-created
            accounts.
          </p>
          {state.error ? (
            <p role="alert" className="mt-2 text-sm font-medium text-danger">
              {state.error}
            </p>
          ) : null}
          {state.success ? (
            <p role="status" className="mt-2 text-sm font-medium text-success">
              {state.success}
            </p>
          ) : null}
        </form>
      </div>
    </section>
  );
}

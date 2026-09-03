"use client";

import { useActionState } from "react";

import { Alert } from "@/components/ui/alert";
import { ImageFileField } from "@/components/ui/image-file-field";
import { SelectField } from "@/components/ui/select-field";
import { SubmitButton } from "@/components/ui/submit-button";
import { usePreserveFormValuesOnError } from "@/components/ui/use-preserve-form-values";

import {
  createExpenseState,
  requestNewPaymentProofState,
  updatePlayerPaymentAmountState,
} from "./actions";

const input =
  "mt-1.5 h-11 w-full rounded-lg border border-line bg-surface px-3 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/15";

export function PaymentAmountForm({
  paymentId,
  name,
  amount,
}: {
  paymentId: string;
  name: string;
  amount: number;
}) {
  const [state, action] = useActionState(updatePlayerPaymentAmountState, {});
  const preserveValues = usePreserveFormValuesOnError(state);
  return (
    <form
      noValidate
      action={action}
      onSubmitCapture={preserveValues}
      className="flex flex-wrap items-start gap-2"
    >
      <input type="hidden" name="paymentId" value={paymentId} />
      <label className="sr-only" htmlFor={`amount-${paymentId}`}>
        Amount for {name}
      </label>
      <div className="relative">
        <span className="absolute left-2.5 top-2 text-xs text-muted">₱</span>
        <input
          id={`amount-${paymentId}`}
          name="amount"
          type="number"
          min="0"
          step="0.01"
          defaultValue={amount}
          aria-invalid={Boolean(state.error)}
          aria-describedby={
            state.error ? `amount-${paymentId}-error` : undefined
          }
          className="score h-9 w-28 rounded-md border border-line bg-surface pl-6 pr-2 text-sm"
        />
      </div>
      <SubmitButton
        pendingLabel="Saving…"
        variant="secondary"
        className="min-h-9"
      >
        Save
      </SubmitButton>
      {state.error ? (
        <div id={`amount-${paymentId}-error`} className="basis-full">
          <Alert>{state.error}</Alert>
        </div>
      ) : null}
    </form>
  );
}

export function PaymentProofRequestForm({ paymentId }: { paymentId: string }) {
  const [state, action] = useActionState(requestNewPaymentProofState, {});
  const preserveValues = usePreserveFormValuesOnError(state);
  return (
    <form
      noValidate
      action={action}
      onSubmitCapture={preserveValues}
      className="mt-2 flex flex-col gap-2 sm:flex-row sm:flex-wrap"
    >
      <input type="hidden" name="paymentId" value={paymentId} />
      <label className="sr-only" htmlFor={`note-${paymentId}`}>
        Reason for requesting new proof
      </label>
      <input
        id={`note-${paymentId}`}
        name="note"
        required
        minLength={2}
        maxLength={240}
        aria-invalid={Boolean(state.error)}
        aria-describedby={state.error ? `note-${paymentId}-error` : undefined}
        placeholder="What needs to be clearer?"
        className="h-11 min-w-0 flex-1 rounded-lg border border-line bg-surface px-3 text-sm"
      />
      <SubmitButton pendingLabel="Sending request…" variant="secondary">
        Send request
      </SubmitButton>
      {state.error ? (
        <div id={`note-${paymentId}-error`} className="basis-full">
          <Alert>{state.error}</Alert>
        </div>
      ) : null}
    </form>
  );
}

export function CreateExpenseForm({
  sessionId,
  bookingTotalCents,
}: {
  sessionId: string;
  bookingTotalCents: number | null;
}) {
  const [state, action] = useActionState(createExpenseState, {});
  const preserveValues = usePreserveFormValuesOnError(state);
  return (
    <form
      noValidate
      action={action}
      onSubmitCapture={preserveValues}
      className="mt-7 space-y-4"
    >
      {state.error ? <Alert>{state.error}</Alert> : null}
      <input type="hidden" name="sessionId" value={sessionId} />
      <div>
        <label className="text-sm font-semibold" htmlFor="label">
          Expense
        </label>
        <input
          className={input}
          id="label"
          name="label"
          defaultValue="Court"
          required
        />
      </div>
      <div>
        <label className="text-sm font-semibold" htmlFor="total">
          Total amount
        </label>
        <input
          className={`${input} score`}
          id="total"
          name="total"
          type="number"
          min="1"
          step="0.01"
          required
          inputMode="decimal"
          autoComplete="off"
          defaultValue={
            bookingTotalCents == null ? undefined : bookingTotalCents / 100
          }
          placeholder="2400"
        />
        {bookingTotalCents != null ? (
          <p className="mt-1.5 text-sm text-muted">
            Prefilled from the court booking. Confirm or change it here.
          </p>
        ) : null}
      </div>
      <SelectField
        id="method"
        name="method"
        label="Payment method"
        defaultValue="GCash"
        options={[
          { value: "GCash", label: "GCash" },
          { value: "Maya", label: "Maya" },
          { value: "Bank transfer", label: "Bank transfer" },
          { value: "Cash", label: "Cash" },
          { value: "Custom", label: "Custom" },
        ]}
      />
      <div>
        <label className="text-sm font-semibold" htmlFor="details">
          Payment details
        </label>
        <textarea
          className="mt-1.5 min-h-24 w-full rounded-lg border border-line bg-surface p-3.5"
          id="details"
          name="details"
          required
          autoComplete="off"
          placeholder="Account name and number…"
        />
      </div>
      <ImageFileField
        id="payment-qr"
        name="qr"
        label="Payment QR (optional)"
        hint="Players can scan this to repay you."
        buttonLabel="Choose QR image"
      />
      <ImageFileField
        id="expense-receipt"
        name="receipt"
        label="Receipt (optional)"
        hint="Show players that you already paid for the court or shared expense."
        buttonLabel="Choose receipt"
      />
      <SubmitButton pendingLabel="Creating split…" className="w-full">
        Create collection
      </SubmitButton>
    </form>
  );
}

"use client";

import { useActionState, useId } from "react";

import { Alert } from "@/components/ui/alert";
import { ImageFileField } from "@/components/ui/image-file-field";
import { SubmitButton } from "@/components/ui/submit-button";
import { usePreserveFormValuesOnError } from "@/components/ui/use-preserve-form-values";

import {
  createExpenseState,
  requestNewPaymentProofState,
  updateExpenseState,
  updatePaymentChoiceState,
  updatePlayerPaymentAmountState,
} from "./actions";

import {
  PaymentSetupFields,
  PlayerPaymentFields,
} from "./payment-setup-fields";

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
      <PaymentSetupFields bookingTotalCents={bookingTotalCents} />
      <PaymentUploadFields />
      <SubmitButton pendingLabel="Creating split…" className="w-full">
        Create collection
      </SubmitButton>
    </form>
  );
}

export function PaymentChoiceForm({
  sessionId,
  price,
  bookingTotalCents,
}: {
  sessionId: string;
  price: number | null;
  bookingTotalCents: number | null;
}) {
  const [state, action] = useActionState(updatePaymentChoiceState, {});
  const preserveValues = usePreserveFormValuesOnError(state);
  return (
    <form
      noValidate
      action={action}
      onSubmitCapture={preserveValues}
      className="flex flex-col gap-4"
    >
      <input type="hidden" name="sessionId" value={sessionId} />
      {state.error ? <Alert>{state.error}</Alert> : null}
      {state.success ? (
        <Alert variant="success">Payment settings saved.</Alert>
      ) : null}
      <PlayerPaymentFields
        defaults={{ costKind: price === 0 ? "free" : "unspecified" }}
        bookingTotalCents={bookingTotalCents}
      />
      <SubmitButton pendingLabel="Saving…">Save payment settings</SubmitButton>
    </form>
  );
}

export function EditExpenseForm({
  sessionId,
  expenseId,
  defaults,
  totalReadOnly,
}: {
  sessionId: string;
  expenseId: string;
  defaults: Record<string, string>;
  totalReadOnly: boolean;
}) {
  const [state, action] = useActionState(updateExpenseState, {});
  const preserveValues = usePreserveFormValuesOnError(state);
  return (
    <form
      noValidate
      action={action}
      onSubmitCapture={preserveValues}
      className="flex flex-col gap-4"
    >
      <input type="hidden" name="sessionId" value={sessionId} />
      <input type="hidden" name="expenseId" value={expenseId} />
      {state.error ? <Alert>{state.error}</Alert> : null}
      {state.success ? (
        <Alert variant="success">Payment settings saved.</Alert>
      ) : null}
      <PaymentSetupFields defaults={defaults} totalReadOnly={totalReadOnly} />
      <PaymentUploadFields />
      <p className="text-sm text-muted">
        Once any player share exists—even an excluded share—the total is
        read-only to protect existing amounts. Payment details and images remain
        editable. Existing receipts and QR images are kept unless you choose a
        replacement.
      </p>
      <SubmitButton pendingLabel="Saving…">Save payment settings</SubmitButton>
    </form>
  );
}

function PaymentUploadFields() {
  const id = useId();
  return (
    <div className="flex flex-col gap-4">
      <ImageFileField
        id={`${id}-payment-qr`}
        name="qr"
        label="Payment QR (optional)"
        hint="Players can scan this to repay you."
        buttonLabel="Choose QR image"
      />
      <ImageFileField
        id={`${id}-expense-receipt`}
        name="receipt"
        label="Receipt (optional)"
        hint="Show players that you already paid for the court or shared expense."
        buttonLabel="Choose receipt"
      />
    </div>
  );
}

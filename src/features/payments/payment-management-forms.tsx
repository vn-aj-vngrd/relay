"use client";

import { useActionState, useId } from "react";

import { Alert } from "@/components/ui/alert";
import { ImageFileField } from "@/components/ui/image-file-field";
import { SelectField } from "@/components/ui/select-field";
import { SubmitButton } from "@/components/ui/submit-button";
import { usePreserveFormValuesOnError } from "@/components/ui/use-preserve-form-values";
import {
  requestNewPaymentProofState,
  updateExpenseState,
  updatePaymentChoiceState,
  updatePlayerPaymentAmountState,
} from "./actions";
import { respondToPaymentAdjustment } from "./adjustment-actions";
import { assignPlayerShare } from "./assign-share-action";

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
      <input
        type="hidden"
        name="expectedAmountCents"
        value={Math.round(amount * 100)}
      />
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
      <div className="min-w-0 flex-1 basis-40">
        <label className="sr-only" htmlFor={`reason-${paymentId}`}>
          Reason for adjusting {name}
        </label>
        <input
          id={`reason-${paymentId}`}
          name="reason"
          required
          minLength={2}
          maxLength={240}
          placeholder="Reason for this adjustment"
          className="h-9 w-full rounded-md border border-line bg-surface px-3 text-sm"
        />
      </div>
      <SubmitButton
        pendingLabel="Saving…"
        variant="secondary"
        className="min-h-9"
      >
        Save adjustment
      </SubmitButton>
      <p className="basis-full text-xs text-muted">
        Reductions apply now. Increases need the player’s agreement.
      </p>
      {state.success ? (
        <div className="basis-full">
          <Alert variant="success">
            Adjustment saved. Any increase awaits the player’s response.
          </Alert>
        </div>
      ) : null}
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
        expanded
        defaults={{ costKind: price === 0 ? "free" : "unspecified" }}
        bookingTotalCents={bookingTotalCents}
      />
      <SubmitButton
        pendingLabel="Saving…"
        className="w-full sm:w-auto sm:self-start"
      >
        Save payment settings
      </SubmitButton>
    </form>
  );
}

export function EditExpenseForm({
  sessionId,
  expenseId,
  defaults,
  totalReadOnly,
  contributionReadOnly = false,
}: {
  sessionId: string;
  expenseId: string;
  defaults: Record<string, string>;
  totalReadOnly: boolean;
  contributionReadOnly?: boolean;
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
      {totalReadOnly || contributionReadOnly ? (
        <p className="max-w-prose text-sm text-muted">
          {totalReadOnly
            ? "Player shares are already assigned. Adjust individual amounts in the Payments tab."
            : "The split type is locked to match this game’s existing payment setup."}
        </p>
      ) : null}
      <PaymentSetupFields
        expanded
        defaults={defaults}
        totalReadOnly={totalReadOnly}
        contributionReadOnly={contributionReadOnly}
      />
      <details className="border-t border-line pt-3">
        <summary className="min-h-9 cursor-pointer py-2 text-sm font-medium">
          QR code and receipt (optional)
        </summary>
        <div className="space-y-3 pt-3">
          <PaymentUploadFields />
          <p className="text-xs text-muted">
            Existing images are kept unless replaced.
          </p>
        </div>
      </details>
      <SubmitButton
        pendingLabel="Saving…"
        className="w-full sm:w-auto sm:self-start"
      >
        Save payment settings
      </SubmitButton>
    </form>
  );
}

export function AssignPlayerShareForm({
  sessionId,
  expenseId,
  players,
}: {
  sessionId: string;
  expenseId: string;
  players: Array<{ id: string; name: string }>;
}) {
  const [state, action] = useActionState(assignPlayerShare, {});
  const preserveValues = usePreserveFormValuesOnError(state);
  const id = useId();
  if (!players.length) return null;
  return (
    <form
      noValidate
      action={action}
      onSubmitCapture={preserveValues}
      className="flex flex-col gap-3"
    >
      <input type="hidden" name="sessionId" value={sessionId} />
      <input type="hidden" name="expenseId" value={expenseId} />
      {state.error ? <Alert>{state.error}</Alert> : null}
      <SelectField
        id={`${id}-player`}
        name="sessionPlayerId"
        label="Player without a share"
        defaultValue={players[0].id}
        options={players.map((player) => ({
          value: player.id,
          label: player.name,
        }))}
      />
      <label htmlFor={`${id}-amount`} className="text-sm font-semibold">
        Proposed amount (₱)
      </label>
      <input
        id={`${id}-amount`}
        name="amount"
        type="number"
        min="0"
        max="1000000"
        step="0.01"
        required
        className="h-11 rounded-lg border border-line bg-surface px-3"
      />
      <label htmlFor={`${id}-reason`} className="text-sm font-semibold">
        Reason
      </label>
      <input
        id={`${id}-reason`}
        name="reason"
        minLength={2}
        maxLength={240}
        required
        className="h-11 rounded-lg border border-line bg-surface px-3"
      />
      <p className="text-sm text-muted">
        A positive amount needs the player’s agreement. Zero records a waiver.
        Other players’ shares stay unchanged.
      </p>
      <SubmitButton pendingLabel="Saving…">Assign share</SubmitButton>
    </form>
  );
}

export function PaymentAdjustmentResponse({
  paymentId,
  proposalId,
}: {
  paymentId: string;
  proposalId: string;
}) {
  const [state, action] = useActionState(respondToPaymentAdjustment, {});
  return (
    <form noValidate action={action} className="mt-3 flex flex-col gap-3">
      <input type="hidden" name="paymentId" value={paymentId} />
      <input type="hidden" name="proposalId" value={proposalId} />
      {state.error ? <Alert>{state.error}</Alert> : null}
      <div className="flex flex-wrap gap-2">
        <SubmitButton name="decision" value="accept" pendingLabel="Saving…">
          Agree to new amount
        </SubmitButton>
        <SubmitButton
          name="decision"
          value="decline"
          variant="secondary"
          pendingLabel="Saving…"
        >
          Keep current amount
        </SubmitButton>
      </div>
    </form>
  );
}

function PaymentUploadFields() {
  const id = useId();
  return (
    <div className="grid min-w-0 gap-6 lg:grid-cols-2 lg:gap-8">
      <ImageFileField
        id={`${id}-payment-qr`}
        name="qr"
        label="Payment QR (optional)"
        hint="Players scan this to pay."
        buttonLabel="Choose QR image"
      />
      <ImageFileField
        id={`${id}-expense-receipt`}
        name="receipt"
        label="Receipt (optional)"
        hint="Proof of the upfront expense."
        buttonLabel="Choose receipt"
      />
    </div>
  );
}

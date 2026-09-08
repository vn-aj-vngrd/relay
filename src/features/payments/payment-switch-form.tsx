"use client";

import { useActionState, useState } from "react";
import { ConfirmSubmitButton } from "@/components/shared/confirm-submit-button";
import { Alert } from "@/components/ui/alert";
import { SelectField } from "@/components/ui/select-field";
import { updatePaymentChoiceState } from "./actions";

export function PaymentSwitchForm({
  sessionId,
  revision,
}: {
  sessionId: string;
  revision: string;
}) {
  const [state, action] = useActionState(updatePaymentChoiceState, {});
  const [choice, setChoice] = useState("collect");
  return (
    <form
      noValidate
      action={action}
      className="flex flex-col items-start gap-4"
    >
      <input type="hidden" name="sessionId" value={sessionId} />
      <input type="hidden" name="paymentRevision" value={revision} />
      {state.error ? <Alert>{state.error}</Alert> : null}
      <div className="w-full">
        <SelectField
          id="switch-payment-choice"
          name="costKind"
          label="Payment choice"
          value={choice}
          onValueChange={setChoice}
          options={[
            { value: "collect", label: "Collect payment" },
            { value: "free", label: "Free" },
          ]}
        />
      </div>
      {choice === "free" ? (
        <ConfirmSubmitButton
          confirmTitle="Make this game free?"
          confirmText="Players will no longer owe outstanding amounts. Expenses, payment records, and proof will stay in history. Submitted proof and previous payments need host follow-up. Relay does not issue refunds."
          confirmLabel="Make game free"
          cancelLabel="Keep collecting"
          pendingLabel="Updating payment choice…"
        >
          Make game free
        </ConfirmSubmitButton>
      ) : null}
    </form>
  );
}

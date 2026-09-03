"use client";

import { UploadSimple } from "@phosphor-icons/react";
import { useActionState } from "react";
import { useFormStatus } from "react-dom";

import { Button, ButtonSpinner } from "@/components/ui/button";
import { ImageFileField } from "@/components/ui/image-file-field";
import { usePreserveFormValuesOnError } from "@/components/ui/use-preserve-form-values";

import { markPaymentSent } from "./actions";

function SubmitProof() {
  const { pending } = useFormStatus();
  return (
    <Button className="w-full sm:w-auto" disabled={pending}>
      {pending ? (
        <>
          <ButtonSpinner />
          Uploading proof…
        </>
      ) : (
        <>
          <UploadSimple aria-hidden size={16} />
          Submit proof
        </>
      )}
    </Button>
  );
}

export function PaymentProofForm({
  paymentId,
  reviewNote,
  slug,
}: {
  paymentId: string;
  reviewNote?: string | null;
  slug?: string;
}) {
  const [state, action] = useActionState(markPaymentSent, {});
  const preserveValues = usePreserveFormValuesOnError(state);
  return (
    <form
      noValidate
      action={action}
      onSubmitCapture={preserveValues}
      className="mt-4 w-full sm:max-w-md"
    >
      <input type="hidden" name="paymentId" value={paymentId} />
      {slug ? <input type="hidden" name="slug" value={slug} /> : null}
      {reviewNote ? (
        <div className="mb-4">
          <p className="text-sm font-[650] text-warning">New proof requested</p>
          <p className="mt-1 text-sm leading-5 text-muted">{reviewNote}</p>
        </div>
      ) : null}
      <ImageFileField
        id={`proof-${paymentId}`}
        name="proof"
        label="Payment screenshot"
        hint="Upload one clear image showing the amount and recipient, up to 5 MB."
        required
      />
      {state.error ? (
        <p role="alert" className="mt-3 text-sm font-medium text-danger">
          {state.error}
        </p>
      ) : null}
      <div className="mt-3">
        <SubmitProof />
      </div>
    </form>
  );
}

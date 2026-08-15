"use client";

import { Upload } from "lucide-react";
import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { Button } from "@/components/ui/button";
import { markPaymentSent } from "./actions";

function SubmitProof() {
  const { pending } = useFormStatus();
  return <Button className="w-full sm:w-auto" disabled={pending}>{pending ? "Uploading proof…" : <><Upload aria-hidden size={16} />Submit proof</>}</Button>;
}

export function PaymentProofForm({ paymentId, reviewNote }: { paymentId: string; reviewNote?: string | null }) {
  const [state, action] = useActionState(markPaymentSent, {});
  return <form action={action} className="mt-3 w-full rounded-xl bg-surface-strong p-4 sm:max-w-md">
    <input type="hidden" name="paymentId" value={paymentId} />
    {reviewNote ? <div className="mb-3"><p className="text-sm font-[650] text-warning">New proof requested</p><p className="mt-1 text-sm leading-5 text-muted">{reviewNote}</p></div> : null}
    <label htmlFor={`proof-${paymentId}`} className="text-sm font-[650]">Payment screenshot</label>
    <p className="mt-1 text-xs leading-5 text-muted">One JPG, PNG, or WebP image, up to 5 MB.</p>
    <input id={`proof-${paymentId}`} name="proof" type="file" required accept="image/jpeg,image/png,image/webp" className="mt-3 block w-full cursor-pointer text-sm text-muted file:mr-3 file:min-h-10 file:cursor-pointer file:rounded-lg file:border-0 file:bg-primary-soft file:px-3 file:text-sm file:font-[650] file:text-primary" />
    {state.error ? <p role="alert" className="mt-3 text-sm font-medium text-danger">{state.error}</p> : null}
    <div className="mt-4"><SubmitProof /></div>
  </form>;
}

import { and, eq } from "drizzle-orm";
import Image from "next/image";
import { notFound } from "next/navigation";
import { z } from "zod";

import { Alert } from "@/components/ui/alert";
import { ButtonLink } from "@/components/ui/button";
import { db } from "@/db/client";
import { billingRequests } from "@/db/schema";
import { requireUser } from "@/features/auth/session";
import { billingFileUrl } from "@/features/billing/files";
import {
  CancelUpgradeForm,
  SubscriptionPaymentForm,
} from "@/features/billing/forms";
import {
  PaymentInstructions,
  requestStatusLabels,
} from "@/features/billing/presentation";

export default async function PaymentRequestPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await requireUser();
  const id = z.uuid().safeParse((await params).id);
  if (!id.success) notFound();
  const request = await db.query.billingRequests.findFirst({
    where: and(
      eq(billingRequests.id, id.data),
      eq(billingRequests.userId, user.id)
    ),
  });
  if (!request) notFound();
  const [qrUrl, downloadUrl, proofUrl] = await Promise.all([
    billingFileUrl(request.snapshot.qrPath),
    billingFileUrl(request.snapshot.qrPath, true),
    billingFileUrl(request.proofPath),
  ]);
  const acceptingProof =
    request.status === "awaiting_payment" || request.status === "clarification";
  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-8">
      <header>
        <ButtonLink href="/settings/plan" variant="secondary">
          Back to Plan & usage
        </ButtonLink>
        <h1 className="app-title mt-5">Pro payment request</h1>
        <p className="mt-2 text-sm text-muted">
          {requestStatusLabels[request.status]}
        </p>
        <p className="mt-2 break-all text-xs text-muted">
          Request reference: {request.id}
        </p>
      </header>
      {request.reviewNote ? (
        <Alert variant={request.status === "rejected" ? "danger" : "info"}>
          {request.reviewNote}
        </Alert>
      ) : null}
      {request.status === "approved" ? (
        <Alert variant="success">
          Payment approved. Your Pro access has been credited. See Plan & usage
          for its dates.
        </Alert>
      ) : null}
      {request.status === "submitted" ? (
        <Alert variant="info">
          Your payment is awaiting verification. Do not pay again. Expected
          review: {request.snapshot.reviewTime}.
        </Alert>
      ) : null}
      <section aria-labelledby="payment-instructions-title">
        <h2
          id="payment-instructions-title"
          className="mb-4 text-lg font-semibold"
        >
          {acceptingProof ? "Pay" : "Requested amount"} ₱
          {(request.amountCents / 100).toFixed(2)}
        </h2>
        <p className="mb-5 max-w-2xl text-sm leading-6 text-muted">
          One calendar month of Pro starts after approval, or extends your
          current term. Manual renewal; no automatic charge. These are the
          payment instructions saved when this request was created.
        </p>
        <PaymentInstructions
          snapshot={request.snapshot}
          qrUrl={qrUrl}
          downloadUrl={downloadUrl}
        />
      </section>
      <section
        aria-labelledby="payment-policy-title"
        className="border-y border-line py-5"
      >
        <h2 id="payment-policy-title" className="text-lg font-semibold">
          Payment and retention policy
        </h2>
        <p className="mt-3 whitespace-pre-wrap text-sm leading-6">
          {request.snapshot.policy}
        </p>
        <p className="mt-3 text-sm text-muted">
          Billing support: {request.snapshot.supportContact}
        </p>
      </section>
      {acceptingProof ? (
        <section aria-labelledby="payment-submit-title">
          <h2 id="payment-submit-title" className="mb-4 text-lg font-semibold">
            Already paid?
          </h2>
          <SubscriptionPaymentForm
            id={request.id}
            reference={request.transactionReference}
          />
        </section>
      ) : null}
      {request.transactionReference ? (
        <p className="break-all text-sm">
          Submitted transaction reference: {request.transactionReference}
        </p>
      ) : null}
      {request.proofPath && !proofUrl ? (
        <Alert variant="info">
          Your proof is recorded, but its preview could not be loaded. Refresh
          to retry.
        </Alert>
      ) : null}
      {proofUrl ? (
        <section aria-labelledby="payment-proof-title">
          <h2 id="payment-proof-title" className="mb-3 text-lg font-semibold">
            Your submitted proof
          </h2>
          <Image
            unoptimized
            src={proofUrl}
            alt="Your subscription payment screenshot"
            width={360}
            height={480}
            className="max-h-96 w-auto max-w-full rounded-lg object-contain"
          />
        </section>
      ) : null}
      {request.status === "awaiting_payment" ? (
        <details className="border-t border-line pt-5">
          <summary className="cursor-pointer text-sm font-semibold">
            Cancel an unpaid request
          </summary>
          <div className="mt-4">
            <CancelUpgradeForm id={request.id} />
          </div>
        </details>
      ) : null}
    </div>
  );
}

import { eq } from "drizzle-orm";
import Image from "next/image";
import { notFound } from "next/navigation";
import { z } from "zod";

import { Alert } from "@/components/ui/alert";
import { ButtonLink } from "@/components/ui/button";
import { db } from "@/db/client";
import { billingRequests, users } from "@/db/schema";
import { AdminPageHeading } from "@/features/admin/admin-page-heading";
import { requireAdmin } from "@/features/admin/auth";
import {
  planIdFromVersion,
  plans,
  storageLabel,
} from "@/features/billing/domain";
import { billingFileUrl } from "@/features/billing/files";
import { PaymentReviewForm } from "@/features/billing/forms";
import {
  PaymentInstructions,
  requestStatusLabels,
} from "@/features/billing/presentation";

export default async function AdminPaymentRequestPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const admin = await requireAdmin();
  const id = z.uuid().safeParse((await params).id);
  if (!id.success) notFound();
  const request = await db.query.billingRequests.findFirst({
    where: eq(billingRequests.id, id.data),
  });
  if (!request) notFound();
  const [user, qrUrl, downloadUrl, proofUrl] = await Promise.all([
    db.query.users.findFirst({ where: eq(users.id, request.userId) }),
    billingFileUrl(request.snapshot.qrPath),
    billingFileUrl(request.snapshot.qrPath, true),
    billingFileUrl(request.proofPath),
  ]);
  return (
    <div>
      <AdminPageHeading
        title="Subscription payment"
        description={`${user?.email ?? "Account"} · ${requestStatusLabels[request.status]}`}
        action={
          <ButtonLink href="/admin/billing" variant="secondary">
            All payment requests
          </ButtonLink>
        }
      />
      <div className="flex flex-col gap-8">
        <p className="text-lg font-semibold">
          Expected amount: ₱{(request.amountCents / 100).toFixed(2)}
        </p>
        <div className="text-sm leading-6">
          <p className="font-semibold">
            {plans[planIdFromVersion(request.planVersion)].name} · one monthly
            term
          </p>
          <p className="text-muted">
            {request.games} games per month ·{" "}
            {storageLabel(request.storageBytes)} total photo storage
          </p>
          <p className="mt-2 text-muted">
            These are the agreed request values, not today’s catalog. Approval
            schedules this term after any existing paid-through access.
          </p>
          <p className="mt-2 break-all text-muted">
            Request reference: {request.id}
          </p>
        </div>
        <PaymentInstructions
          snapshot={request.snapshot}
          qrUrl={qrUrl}
          downloadUrl={downloadUrl}
        />
        <section
          aria-labelledby="received-payment-title"
          className="border-y border-line py-5"
        >
          <h2 id="received-payment-title" className="text-lg font-semibold">
            Submitted payment
          </h2>
          <p className="mt-3 break-all text-sm">
            Transaction reference:{" "}
            {request.transactionReference ?? "Not submitted"}
          </p>
          {proofUrl ? (
            <Image
              unoptimized
              src={proofUrl}
              alt="Submitted subscription payment screenshot; verify against actual received funds"
              width={400}
              height={600}
              className="mt-4 max-h-120 w-auto max-w-full rounded-lg object-contain"
            />
          ) : (
            <p className="mt-3 text-sm text-muted">
              {request.proofPath
                ? "The submitted screenshot could not be loaded. Refresh to retry; do not infer that no proof was submitted."
                : "No screenshot attached. Verify using the actual transaction reference."}
            </p>
          )}
        </section>
        {request.reviewNote ? (
          <Alert variant="info">Last review: {request.reviewNote}</Alert>
        ) : null}
        {["submitted", "clarification"].includes(request.status) ? (
          admin.id === request.userId ? (
            <Alert variant="info">
              Another administrator must verify your payment.
            </Alert>
          ) : (
            <section aria-labelledby="payment-review-title">
              <h2
                id="payment-review-title"
                className="mb-4 text-lg font-semibold"
              >
                Verify payment
              </h2>
              <PaymentReviewForm id={request.id} />
            </section>
          )
        ) : null}
        <ButtonLink
          href={`/admin/users/${request.userId}/billing`}
          variant="secondary"
          className="self-start"
        >
          Account plan & allowances
        </ButtonLink>
      </div>
    </div>
  );
}

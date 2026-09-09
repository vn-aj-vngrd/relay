import { and, desc, eq, inArray, lt, or } from "drizzle-orm";
import { Suspense } from "react";

import { Alert } from "@/components/ui/alert";
import { ButtonLink } from "@/components/ui/button";
import { db } from "@/db/client";
import { billingMethods, billingRequests, billingSettings } from "@/db/schema";
import { encodeAdminCursor, parseAdminCursor } from "@/features/admin/cursor";
import { requireUser } from "@/features/auth/session";
import { billingDate } from "@/features/billing/domain";
import { UpgradeForm } from "@/features/billing/forms";
import {
  PlanComparison,
  PlanUsage,
  requestStatusLabels,
} from "@/features/billing/presentation";
import { getAccountUsage } from "@/features/billing/usage";

async function PlanContent({
  searchParams,
}: {
  searchParams: Promise<{ cursor?: string }>;
}) {
  const user = await requireUser();
  const query = await searchParams;
  const cursor = parseAdminCursor(query.cursor);
  const [usage, settings, methods, history, open] = await Promise.all([
    getAccountUsage(user.id),
    db.query.billingSettings.findFirst({
      where: eq(billingSettings.id, "global"),
    }),
    db.query.billingMethods.findMany({
      where: eq(billingMethods.enabled, true),
      columns: { id: true, provider: true, recipient: true },
    }),
    db.query.billingRequests.findMany({
      where: and(
        eq(billingRequests.userId, user.id),
        cursor
          ? or(
              lt(billingRequests.createdAt, cursor.at),
              and(
                eq(billingRequests.createdAt, cursor.at),
                lt(billingRequests.id, cursor.id)
              )
            )
          : undefined
      ),
      orderBy: [desc(billingRequests.createdAt), desc(billingRequests.id)],
      limit: 31,
    }),
    db.query.billingRequests.findFirst({
      where: and(
        eq(billingRequests.userId, user.id),
        inArray(billingRequests.status, [
          "awaiting_payment",
          "submitted",
          "clarification",
        ])
      ),
    }),
  ]);
  const requests = history.slice(0, 30);
  const last = requests.at(-1);
  return (
    <div className="flex flex-col gap-10">
      <div>
        <PlanUsage usage={usage} />
        <ButtonLink
          href="/settings/plan/media"
          variant="secondary"
          className="mt-4"
        >
          Manage hosted-game photos
        </ButtonLink>
      </div>
      <PlanComparison />
      <section
        aria-labelledby="upgrade-title"
        className="border-t border-line pt-6"
      >
        <h2 id="upgrade-title" className="mb-4 text-lg font-semibold">
          {usage.plan === "pro" ? "Renew Pro" : "Upgrade to Pro"}
        </h2>
        {open ? (
          <>
            <p className="mb-4 text-sm text-muted">
              Your current request: {requestStatusLabels[open.status]}.
            </p>
            <ButtonLink href={`/settings/plan/requests/${open.id}`}>
              View payment request
            </ButtonLink>
          </>
        ) : settings?.acceptingPayments && methods.length ? (
          <UpgradeForm methods={methods} renewing={usage.plan === "pro"} />
        ) : (
          <Alert variant="info">
            Paid upgrades are not available yet. Your current access remains
            unchanged.
            {settings?.supportContact
              ? ` Contact ${settings.supportContact} for help.`
              : ""}
          </Alert>
        )}
      </section>
      <section aria-labelledby="billing-history-title">
        <h2 id="billing-history-title" className="text-lg font-semibold">
          Payment requests
        </h2>
        {requests.length ? (
          <ul className="mt-4 divide-y divide-line border-y border-line">
            {requests.map((request) => (
              <li
                key={request.id}
                className="flex flex-wrap items-center justify-between gap-3 py-4"
              >
                <div>
                  <p className="text-sm font-semibold">
                    {requestStatusLabels[request.status]} · ₱
                    {(request.amountCents / 100).toFixed(2)}
                  </p>
                  <p className="mt-1 text-xs text-muted">
                    {billingDate(request.createdAt)} (PH)
                  </p>
                </div>
                <ButtonLink
                  href={`/settings/plan/requests/${request.id}`}
                  variant="secondary"
                >
                  View request
                </ButtonLink>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-3 text-sm text-muted">
            No subscription payments requested.
          </p>
        )}
        <div className="mt-4 flex flex-wrap gap-3">
          {cursor ? (
            <ButtonLink href="/settings/plan" variant="secondary">
              Newest requests
            </ButtonLink>
          ) : null}
          {history.length > 30 && last ? (
            <ButtonLink
              href={`/settings/plan?cursor=${encodeAdminCursor({ at: last.createdAt, id: last.id })}`}
              variant="secondary"
            >
              Older requests
            </ButtonLink>
          ) : null}
        </div>
      </section>
    </div>
  );
}
export default function PlanPage({
  searchParams,
}: {
  searchParams: Promise<{ cursor?: string }>;
}) {
  return (
    <div className="mx-auto w-full max-w-6xl">
      <header className="pb-6">
        <h1 className="app-title">Plan & usage</h1>
        <p className="mt-2 text-sm text-muted">
          Your hosting allowance, photo storage and personal subscription.
        </p>
      </header>
      <Suspense
        fallback={
          <p role="status" className="py-6 text-sm text-muted">
            Loading your plan and usage…
          </p>
        }
      >
        <PlanContent searchParams={searchParams} />
      </Suspense>
    </div>
  );
}

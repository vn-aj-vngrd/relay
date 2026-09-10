import { and, desc, eq, inArray, lt, or } from "drizzle-orm";

import { Alert } from "@/components/ui/alert";
import { ButtonLink } from "@/components/ui/button";
import { db } from "@/db/client";
import {
  billingMethods,
  billingOverrides,
  billingRequests,
  billingSettings,
  billingTerms,
} from "@/db/schema";
import { encodeAdminCursor, parseAdminCursor } from "@/features/admin/cursor";
import { requireUser } from "@/features/auth/session";
import {
  billingDate,
  normalizeBillingCatalog,
  planIdFromVersion,
  plans,
  publicBillingPlans,
} from "@/features/billing/domain";
import { UpgradeForm } from "@/features/billing/forms";
import { PlanCards } from "@/features/billing/plan-comparison";
import { PlanHistory } from "@/features/billing/plan-history";
import {
  PlanUsage,
  requestStatusLabels,
} from "@/features/billing/presentation";
import { getAccountUsage } from "@/features/billing/usage";
import {
  type BillingPageQuery,
  billingSection,
  billingSectionHref,
} from "./navigation";

const historyPageSize = 5;
function historyHref(requestCursor?: string, termCursor?: string) {
  return billingSectionHref("history", {
    cursor: requestCursor,
    terms: termCursor,
  });
}

export async function AccountBilling({
  searchParams,
}: {
  searchParams: Promise<BillingPageQuery>;
}) {
  const user = await requireUser();
  const query = await searchParams;
  const section = billingSection(query);
  const cursor = parseAdminCursor(query.cursor);
  const termCursor = parseAdminCursor(query.terms);
  const now = new Date();
  const [usage, settings, methods, history, open, termRows, assignment] =
    await Promise.all([
      section !== "history"
        ? getAccountUsage(user.id, db, now)
        : Promise.resolve(null),
      section !== "history"
        ? db.query.billingSettings.findFirst({
            where: eq(billingSettings.id, "global"),
          })
        : Promise.resolve(null),
      section === "plans"
        ? db.query.billingMethods.findMany({
            where: eq(billingMethods.enabled, true),
            columns: { id: true, provider: true, recipient: true },
          })
        : Promise.resolve([]),
      section === "history"
        ? db.query.billingRequests.findMany({
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
            orderBy: [
              desc(billingRequests.createdAt),
              desc(billingRequests.id),
            ],
            limit: historyPageSize + 1,
          })
        : Promise.resolve([]),
      section !== "history"
        ? db.query.billingRequests.findFirst({
            where: and(
              eq(billingRequests.userId, user.id),
              inArray(billingRequests.status, [
                "awaiting_payment",
                "submitted",
                "clarification",
              ])
            ),
          })
        : Promise.resolve(null),
      section === "history"
        ? db.query.billingTerms.findMany({
            where: and(
              eq(billingTerms.userId, user.id),
              termCursor
                ? or(
                    lt(billingTerms.createdAt, termCursor.at),
                    and(
                      eq(billingTerms.createdAt, termCursor.at),
                      lt(billingTerms.id, termCursor.id)
                    )
                  )
                : undefined
            ),
            orderBy: [desc(billingTerms.createdAt), desc(billingTerms.id)],
            limit: historyPageSize + 1,
          })
        : Promise.resolve([]),
      section === "history"
        ? db.query.billingOverrides.findFirst({
            where: eq(billingOverrides.userId, user.id),
          })
        : Promise.resolve(null),
    ]);
  const catalog = publicBillingPlans(
    normalizeBillingCatalog(settings?.planCatalog)
  );
  const acceptingPayments = Boolean(
    settings?.acceptingPayments && methods.length
  );
  const selectedPlan = catalog.find(
    (plan) =>
      plan.id === query.plan &&
      plan.id !== "free" &&
      plan.availability === "active"
  );
  const requests = history.slice(0, historyPageSize);
  const terms = termRows.slice(0, historyPageSize);
  const lastRequest = requests.at(-1);
  const lastTerm = terms.at(-1);

  return (
    <div className="flex flex-col gap-8">
      {section === "current" && usage ? (
        <div>
          <PlanUsage
            usage={usage}
            compact
            planAction={
              <ButtonLink
                href={billingSectionHref("plans")}
                variant="secondary"
              >
                View plans
              </ButtonLink>
            }
            storageAction={
              <ButtonLink
                href="/settings/plan/media"
                variant="quiet"
                className="-mr-3 text-primary"
              >
                Manage photos
              </ButtonLink>
            }
          />
          {usage.planAssigned ? (
            <p className="mt-3 max-w-2xl text-sm leading-6 text-muted">
              Your plan is managed by an admin. Contact support to change it.
              {settings?.supportContact ? ` ${settings.supportContact}` : ""}
            </p>
          ) : null}
        </div>
      ) : null}

      {open ? (
        <section
          id="upgrade-title"
          aria-labelledby="pending-payment-title"
          className="scroll-mt-6"
        >
          <Alert variant="info">
            <h2 id="pending-payment-title" className="font-semibold">
              {requestStatusLabels[open.status]}
            </h2>
            <p className="mt-1">
              {open.status === "submitted"
                ? "Your payment is being reviewed. Do not pay again."
                : "Continue your existing request before starting another."}
            </p>
            <ButtonLink
              href={`/settings/plan/requests/${open.id}`}
              variant="secondary"
              className="mt-3"
            >
              View payment request
            </ButtonLink>
          </Alert>
        </section>
      ) : null}

      {section === "plans" && usage ? (
        <section aria-labelledby="available-plans-title">
          <h2 id="available-plans-title" className="text-lg font-semibold">
            Monthly hosting plans
          </h2>
          <p className="mb-4 mt-2 text-sm leading-6 text-muted">
            More games per month and more room for photos. Your players don’t
            need a paid plan. Paid renewal is manual, with no automatic charges.
          </p>
          {usage.planAssigned ? (
            <p className="mb-4 text-sm text-muted">
              Your current {plans[usage.plan].name} plan is managed by an admin.
              Contact support to change it.
            </p>
          ) : null}
          <PlanCards
            catalog={catalog}
            acceptingPayments={acceptingPayments}
            account
            currentPlan={usage.plan}
            allowPurchases={!usage.planAssigned}
          />
          <ButtonLink href="/pricing" variant="quiet" className="mt-4">
            Compare all features and plan details
          </ButtonLink>
        </section>
      ) : null}

      {section === "plans" &&
      usage &&
      !open &&
      !usage.planAssigned &&
      query.plan ? (
        <section
          id="upgrade-title"
          aria-labelledby="selected-plan-title"
          className="scroll-mt-6 border-t border-line pt-6"
        >
          {selectedPlan && acceptingPayments ? (
            <>
              <h2
                id="selected-plan-title"
                className="mb-4 text-lg font-semibold"
              >
                {usage.plan === selectedPlan.id ? "Renew" : "Choose"}{" "}
                {selectedPlan.name}
              </h2>
              <UpgradeForm
                key={selectedPlan.version}
                methods={methods}
                renewing={usage.plan !== "free"}
                catalog={[selectedPlan]}
              />
            </>
          ) : (
            <Alert variant="info">
              <h2 id="selected-plan-title" className="font-semibold">
                This plan is not available for purchase
              </h2>
              <p className="mt-1">
                See the cards above for current availability. Your access is
                unchanged.
              </p>
            </Alert>
          )}
          <ButtonLink
            href={billingSectionHref("plans")}
            variant="quiet"
            className="mt-4"
          >
            Back to plans
          </ButtonLink>
        </section>
      ) : null}

      {section === "history" ? (
        <div>
          <PlanHistory
            terms={terms}
            assignment={assignment}
            now={now}
            assigned={Boolean(
              assignment?.planOverride &&
                (!assignment.expiresAt || assignment.expiresAt > now)
            )}
            olderPage={Boolean(termCursor)}
          />
          <div className="mt-4 flex flex-wrap gap-3">
            {termCursor ? (
              <ButtonLink
                href={`${historyHref(query.cursor)}#plan-history-title`}
                variant="secondary"
              >
                Latest plan history
              </ButtonLink>
            ) : null}
            {termRows.length > historyPageSize && lastTerm ? (
              <ButtonLink
                href={`${historyHref(query.cursor, encodeAdminCursor({ at: lastTerm.createdAt, id: lastTerm.id }))}#plan-history-title`}
                variant="secondary"
              >
                Older plan history
              </ButtonLink>
            ) : null}
          </div>
        </div>
      ) : null}

      {section === "history" ? (
        <section
          id="payment-history"
          aria-labelledby="payment-history-title"
          className="border-t border-line pt-6"
        >
          <h2 id="payment-history-title" className="text-lg font-semibold">
            Payment history
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
                      {plans[planIdFromVersion(request.planVersion)].name} ·{" "}
                      {requestStatusLabels[request.status]} · ₱
                      {(request.amountCents / 100).toFixed(2)}
                    </p>
                    <p className="mt-1 text-xs text-muted">
                      {billingDate(request.createdAt)} (PH)
                    </p>
                  </div>
                  <ButtonLink
                    href={`/settings/plan/requests/${request.id}`}
                    variant="quiet"
                  >
                    View request
                  </ButtonLink>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-3 text-sm text-muted">
              {cursor
                ? "No earlier payment requests on this page."
                : "No payment requests yet."}
            </p>
          )}
          <div className="mt-4 flex flex-wrap gap-3">
            {cursor ? (
              <ButtonLink
                href={`${historyHref(undefined, query.terms)}#payment-history`}
                variant="secondary"
              >
                Newest requests
              </ButtonLink>
            ) : null}
            {history.length > historyPageSize && lastRequest ? (
              <ButtonLink
                href={`${historyHref(encodeAdminCursor({ at: lastRequest.createdAt, id: lastRequest.id }), query.terms)}#payment-history`}
                variant="secondary"
              >
                Older requests
              </ButtonLink>
            ) : null}
          </div>
        </section>
      ) : null}
    </div>
  );
}

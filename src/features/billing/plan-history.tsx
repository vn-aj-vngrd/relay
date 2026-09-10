import { ButtonLink } from "@/components/ui/button";

import {
  type BillingPlan,
  billingDate,
  planIdFromVersion,
  plans,
  storageLabel,
} from "./domain";

export type PlanHistoryTerm = {
  id: string;
  requestId: string | null;
  planVersion: string;
  source: "manual" | "complimentary";
  startsAt: Date;
  endsAt: Date;
  games: number;
  storageBytes: number;
};

export function termHistoryStatus(
  term: Pick<PlanHistoryTerm, "startsAt" | "endsAt">,
  now: Date,
  assigned: boolean
) {
  if (term.endsAt <= now) return "Ended";
  if (term.startsAt > now) return "Scheduled term";
  return assigned ? "Active term · admin plan takes precedence" : "Active term";
}

export function PlanHistory({
  terms,
  assignment,
  now,
  assigned,
  olderPage = false,
}: {
  terms: PlanHistoryTerm[];
  assignment?: {
    planOverride: BillingPlan | null;
    updatedAt: Date;
    expiresAt: Date | null;
  } | null;
  now: Date;
  assigned: boolean;
  olderPage?: boolean;
}) {
  const latestAssignment = assignment?.planOverride;
  return (
    <section aria-labelledby="plan-history-title">
      <h2 id="plan-history-title" className="text-lg font-semibold">
        Plan history
      </h2>
      <p className="mt-2 text-sm text-muted">
        Paid and complimentary terms, plus your latest admin plan assignment.
      </p>
      {!terms.length && !latestAssignment ? (
        <p className="mt-4 text-sm text-muted">
          {olderPage
            ? "No earlier plan terms on this page."
            : "No plan changes yet. See My plan for your current access."}
        </p>
      ) : (
        <ul className="mt-4 divide-y divide-line border-y border-line">
          {latestAssignment && assignment ? (
            <li className="py-4">
              <p className="text-sm font-semibold">
                {latestAssignment.name} · Admin-assigned
              </p>
              <p className="mt-1 text-sm text-muted">
                Last updated {billingDate(assignment.updatedAt)} (PH)
              </p>
              <p className="mt-1 text-sm text-muted">
                {assignment.expiresAt
                  ? `${assignment.expiresAt <= now ? "Ended" : "Until"} ${billingDate(assignment.expiresAt)} (PH)`
                  : "No expiry · managed by an admin"}
              </p>
            </li>
          ) : null}
          {terms.map((term) => (
            <li
              key={term.id}
              className="flex flex-wrap items-start justify-between gap-3 py-4"
            >
              <div className="min-w-0">
                <p className="text-sm font-semibold">
                  {plans[planIdFromVersion(term.planVersion)].name} ·{" "}
                  {term.source === "manual" ? "Paid" : "Complimentary"}
                </p>
                <p className="mt-1 text-sm text-muted">
                  {billingDate(term.startsAt)} – {billingDate(term.endsAt)} (PH)
                </p>
                <p className="mt-1 text-sm text-muted">
                  {termHistoryStatus(term, now, assigned)}
                </p>
                <details className="mt-2 text-sm">
                  <summary className="cursor-pointer py-1 text-muted">
                    Agreed allowances
                  </summary>
                  <p className="mt-2 text-muted">
                    {term.games} games for this term ·{" "}
                    {storageLabel(term.storageBytes)} total photo storage
                  </p>
                </details>
              </div>
              {term.requestId ? (
                <ButtonLink
                  href={`/settings/plan/requests/${term.requestId}`}
                  variant="quiet"
                >
                  View payment
                </ButtonLink>
              ) : null}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

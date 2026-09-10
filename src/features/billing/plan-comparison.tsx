import {
  CheckCircle,
  Clock,
  PauseCircle,
} from "@phosphor-icons/react/dist/ssr";

import { ButtonLink } from "@/components/ui/button";

import { type BillingPlan, type PlanId, publicBillingPlans } from "./domain";
import {
  getPricingComparison,
  planDescriptions,
  pricingQuestions,
  pricingStatus,
  pricingStorage,
} from "./pricing-catalog";

export function PlanCards({
  catalog: inputCatalog,
  acceptingPayments = false,
  account = false,
  currentPlan,
  allowPurchases = true,
}: {
  catalog: BillingPlan[];
  acceptingPayments?: boolean;
  account?: boolean;
  currentPlan?: PlanId;
  allowPurchases?: boolean;
}) {
  const catalog = publicBillingPlans(inputCatalog);
  if (!catalog.length)
    return (
      <p className="text-sm text-muted">
        No public plans are listed right now. Your current account access is
        unchanged.
      </p>
    );
  return (
    <div className="grid gap-4 md:grid-cols-[repeat(auto-fit,minmax(220px,1fr))]">
      {catalog.map((plan) => {
        const status = pricingStatus(plan, acceptingPayments);
        const available = status === "Available now";
        const StatusIcon = available
          ? CheckCircle
          : status === "Coming soon"
            ? Clock
            : PauseCircle;
        const highlighted =
          available && (account ? currentPlan === plan.id : plan.id === "free");
        return (
          <article
            key={plan.id}
            aria-label={`${plan.name} plan`}
            className={`row-span-6 grid min-w-0 grid-rows-subgrid gap-y-0 rounded-xl border bg-surface p-6 ${highlighted ? "border-primary" : "border-line"}`}
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h3 className="text-xl font-semibold">{plan.name}</h3>
              <span
                className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${available ? "bg-success/8 text-success" : "bg-surface-raised text-muted"}`}
              >
                <StatusIcon aria-hidden size={14} />
                {status}
              </span>
            </div>
            <p className="mt-3 text-sm leading-6 text-muted">
              {currentPlan === plan.id ? (
                <span className="mb-1 block font-medium text-ink">
                  Your current tier
                </span>
              ) : null}
              {planDescriptions[plan.id]}
            </p>
            <p className="mt-6">
              <span className="score text-4xl font-semibold">
                ₱
                {(plan.priceCents / 100).toLocaleString("en-PH", {
                  maximumFractionDigits: 2,
                })}
              </span>
              <span className="ml-2 text-sm text-muted">/ month</span>
            </p>
            <p className="mt-2 text-sm text-muted">
              {plan.id === "free"
                ? "No payment required"
                : "Per host · manually renewed"}
            </p>
            <ul className="my-6 flex flex-col gap-3 text-sm">
              <li>
                <strong>{plan.games} games per month</strong>
              </li>
              <li>
                <strong>{pricingStorage(plan.storageBytes)}</strong> total photo
                storage
              </li>
              <li>All core game features included</li>
              <li>No subscription needed for your players</li>
            </ul>
            <div className="mt-auto">
              {plan.id === "free" ? (
                account ? (
                  <p className="text-sm text-muted">No payment required</p>
                ) : available ? (
                  <ButtonLink
                    href="/signup"
                    variant="primary"
                    className="w-full"
                  >
                    Start with Free
                  </ButtonLink>
                ) : (
                  <p className="text-sm text-muted">
                    {status === "Coming soon"
                      ? "Not available yet"
                      : "Currently unavailable"}
                  </p>
                )
              ) : status === "Available now" ? (
                allowPurchases ? (
                  <ButtonLink
                    href={
                      account
                        ? `/settings/plan?section=plans&plan=${plan.id}#upgrade-title`
                        : "/settings/plan?section=plans"
                    }
                    variant={
                      account && currentPlan !== plan.id
                        ? "primary"
                        : "secondary"
                    }
                    className="w-full"
                  >
                    {account
                      ? currentPlan === plan.id
                        ? `Renew ${plan.name}`
                        : `Choose ${plan.name}`
                      : `View ${plan.name} payment options`}
                  </ButtonLink>
                ) : (
                  <p className="text-sm text-muted">
                    Contact support to change plans
                  </p>
                )
              ) : (
                <p className="flex min-h-9 items-center justify-center border-t border-line pt-3 text-sm text-muted">
                  {status === "Coming soon"
                    ? "Not available yet"
                    : "Purchases are temporarily paused"}
                </p>
              )}
            </div>
          </article>
        );
      })}
    </div>
  );
}

export function PlanComparison({
  catalog: inputCatalog,
}: {
  catalog: BillingPlan[];
}) {
  const catalog = publicBillingPlans(inputCatalog);
  if (!catalog.length) return null;
  return (
    <section aria-labelledby="plan-comparison-title" className="min-w-0">
      <h2 id="plan-comparison-title" className="text-2xl font-semibold">
        Compare every detail
      </h2>
      <p className="mt-3 max-w-2xl text-sm leading-6 text-muted">
        Games are a monthly allowance. Photo storage is the total you keep, not
        a new allowance each month. Prices are in Philippine pesos.
      </p>
      <div
        role="region"
        aria-label="Plan comparison, scroll horizontally to see all plans"
        tabIndex={0}
        className="mt-6 overflow-x-auto"
      >
        <table className="w-full min-w-[640px] text-left text-sm">
          <caption className="sr-only">
            {catalog.map((plan) => plan.name).join(", ")} monthly plans
          </caption>
          <thead>
            <tr className="border-b border-line">
              <th scope="col" className="w-2/5 py-4 pr-4">
                Feature or allowance
              </th>
              {catalog.map((plan) => (
                <th key={plan.id} scope="col" className="px-4 py-4">
                  {plan.name}
                </th>
              ))}
            </tr>
          </thead>
          {getPricingComparison(catalog).map((group) => (
            <tbody key={group.title}>
              <tr className="border-b border-line bg-surface-raised">
                <th
                  scope="rowgroup"
                  colSpan={catalog.length + 1}
                  className="px-3 py-3 font-semibold"
                >
                  {group.title}
                </th>
              </tr>
              {group.rows.map((row) => (
                <tr key={row.label} className="border-b border-line">
                  <th scope="row" className="py-4 pr-4 font-medium">
                    {row.label}
                  </th>
                  {catalog.map((plan, index) => (
                    <td key={plan.id} className="px-4 py-4 leading-6">
                      {row.values[index]}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          ))}
        </table>
      </div>
      <p className="mt-3 text-sm leading-6 text-muted">
        On smaller screens, scroll the table sideways. Paid-plan availability is
        shown in the cards above.
      </p>
    </section>
  );
}

export function PricingQuestions() {
  return (
    <section aria-labelledby="pricing-questions-title">
      <h2 id="pricing-questions-title" className="text-2xl font-semibold">
        How plans work
      </h2>
      <div className="mt-6 divide-y divide-line border-y border-line">
        {pricingQuestions.map((item) => (
          <details key={item.question} className="py-4">
            <summary className="cursor-pointer py-2 text-base font-semibold">
              {item.question}
            </summary>
            <p className="mt-3 max-w-3xl text-sm leading-7 text-muted">
              {item.answer}
            </p>
          </details>
        ))}
      </div>
    </section>
  );
}

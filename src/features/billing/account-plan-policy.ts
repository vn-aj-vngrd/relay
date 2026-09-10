import type { BillingPlan, resolveAllowance } from "./domain";

export type AccountPlanSummary = {
  name: string;
  action: "Upgrade plan" | "Explore plans" | "Plan & billing";
};

export function accountPlanHref(action: AccountPlanSummary["action"]) {
  return action === "Plan & billing"
    ? "/settings/plan"
    : "/settings/plan?section=plans";
}

export function accountPlanAction(
  allowance: ReturnType<typeof resolveAllowance>,
  catalog: BillingPlan[],
  acceptingPayments: boolean
): AccountPlanSummary["action"] {
  if (
    allowance.planAssigned ||
    allowance.gamesOverridden ||
    allowance.storageOverridden ||
    allowance.plan === "unlimited"
  )
    return "Plan & billing";
  const improvements = catalog.filter(
    (plan) =>
      plan.visible &&
      plan.id !== "unlimited" &&
      plan.id !== "free" &&
      (plan.games > allowance.games ||
        plan.storageBytes > allowance.storageBytes)
  );
  if (
    acceptingPayments &&
    improvements.some(
      (plan) =>
        plan.availability === "active" &&
        plan.games >= allowance.games &&
        plan.storageBytes >= allowance.storageBytes
    )
  )
    return "Upgrade plan";
  return improvements.length ? "Explore plans" : "Plan & billing";
}

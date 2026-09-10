import "server-only";

import { and, desc, eq, gt, lte } from "drizzle-orm";
import { cache } from "react";

import { db } from "@/db/client";
import { billingOverrides, billingTerms } from "@/db/schema";
import { accountPlanAction } from "./account-plan-policy";
import { getAdminBillingOffer } from "./catalog";
import { plans, resolveAllowance } from "./domain";

// Request-local memoization shares the shell/profile lookup. No usage sums or
// cross-request cache: expiry and assignment changes resolve from current data.
export const getAccountPlanSummary = cache(async (userId: string) => {
  const now = new Date();
  const [term, override, offer] = await Promise.all([
    db.query.billingTerms.findFirst({
      where: and(
        eq(billingTerms.userId, userId),
        lte(billingTerms.startsAt, now),
        gt(billingTerms.endsAt, now)
      ),
      orderBy: desc(billingTerms.startsAt),
    }),
    db.query.billingOverrides.findFirst({
      where: eq(billingOverrides.userId, userId),
    }),
    getAdminBillingOffer(),
  ]);
  const allowance = resolveAllowance({
    now,
    term,
    override,
    freePlan: offer.catalog.find((plan) => plan.id === "free"),
  });
  return {
    name: plans[allowance.plan].name,
    action: accountPlanAction(
      allowance,
      offer.catalog,
      offer.acceptingPayments
    ),
  };
});

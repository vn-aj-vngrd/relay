import "server-only";

import { eq } from "drizzle-orm";

import { db } from "@/db/client";
import { billingMethods, billingSettings } from "@/db/schema";
import { getPublicAgentOffer } from "@/features/agent/public-offer";
import { resolveImageUploadLimits } from "@/lib/upload-config";

import { normalizeBillingCatalog, publicBillingPlans } from "./domain";
import type { BillingTransaction } from "./usage";

export async function getAdminBillingOffer() {
  const [settings, method] = await Promise.all([
    db.query.billingSettings.findFirst({
      where: eq(billingSettings.id, "global"),
    }),
    db.query.billingMethods.findFirst({
      where: eq(billingMethods.enabled, true),
      columns: { id: true },
    }),
  ]);
  return {
    catalog: normalizeBillingCatalog(settings?.planCatalog),
    acceptingPayments: Boolean(settings?.acceptingPayments && method),
    ...resolveImageUploadLimits(settings),
  };
}

export async function getBillingOffer() {
  const [offer, agent] = await Promise.all([
    getAdminBillingOffer(),
    getPublicAgentOffer(),
  ]);
  return { ...offer, agent, catalog: publicBillingPlans(offer.catalog) };
}

export async function getBillingCatalog(
  connection: BillingTransaction | typeof db = db
) {
  const settings = await connection.query.billingSettings.findFirst({
    where: eq(billingSettings.id, "global"),
  });
  return normalizeBillingCatalog(settings?.planCatalog);
}

export async function getImageUploadLimits(
  connection: BillingTransaction | typeof db = db
) {
  const settings = await connection.query.billingSettings.findFirst({
    where: eq(billingSettings.id, "global"),
    columns: { chatImageMaxMiB: true, memoryImageMaxMiB: true },
  });
  return resolveImageUploadLimits(settings);
}

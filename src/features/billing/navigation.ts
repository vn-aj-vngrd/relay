export type BillingSection = "current" | "plans" | "history";
export type BillingPageQuery = {
  section?: string;
  cursor?: string;
  terms?: string;
  plan?: string;
  payments?: string;
};

export function billingSection(query: BillingPageQuery): BillingSection {
  if (
    query.section === "current" ||
    query.section === "plans" ||
    query.section === "history"
  ) {
    return query.section;
  }
  // Preserve links issued before the tabbed account page existed.
  if (query.plan) return "plans";
  if (query.cursor || query.terms || query.payments === "1") return "history";
  return "current";
}

export function billingSectionHref(
  section: BillingSection,
  query: BillingPageQuery = {}
) {
  const params = new URLSearchParams();
  params.set("section", section);
  if (query.cursor) params.set("cursor", query.cursor);
  if (query.terms) params.set("terms", query.terms);
  if (section === "plans" && query.plan) params.set("plan", query.plan);
  return `/settings/plan?${params.toString()}`;
}

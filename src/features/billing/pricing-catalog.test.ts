import { expect, it } from "vitest";

import { defaultBillingPlans, publicBillingPlans } from "./domain";
import { getPricingComparison } from "./pricing-catalog";

it("shows independent admin photo limits for every public plan", () => {
  const groups = getPricingComparison(
    publicBillingPlans(defaultBillingPlans),
    3 * 1024 * 1024,
    4 * 1024 * 1024
  );
  const values = groups.flatMap((group) =>
    group.rows.flatMap((row) => row.values)
  );
  expect(values.filter((value) => value === "3 MiB")).toHaveLength(3);
  expect(values.filter((value) => value === "4 MiB")).toHaveLength(3);
});

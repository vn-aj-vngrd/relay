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

it("uses configured Agent allowances across pricing comparisons", () => {
  const groups = getPricingComparison(
    publicBillingPlans(defaultBillingPlans),
    undefined,
    undefined,
    { freeMessages: 75, plusMessages: 350, proMessages: 900 }
  );
  expect(
    groups.find((group) => group.title.startsWith("Agent"))?.rows[0]
  ).toEqual({
    label: "Agent messages per month",
    values: ["75", "350", "900"],
  });
});

it("does not claim Agent is included when a tier has no allowance or Agent is disabled", () => {
  const catalog = publicBillingPlans(defaultBillingPlans);
  const disabled = getPricingComparison(catalog, undefined, undefined, {
    freeMessages: 0,
    plusMessages: 250,
    proMessages: 750,
    enabled: false,
  });
  expect(
    disabled.find((group) => group.title.startsWith("Agent"))?.rows[1].values
  ).toEqual(["Not included", "Coming soon", "Coming soon"]);
  const enabled = getPricingComparison(catalog, undefined, undefined, {
    freeMessages: 0,
    plusMessages: 250,
    proMessages: 750,
    enabled: true,
  });
  expect(
    enabled.find((group) => group.title.startsWith("Agent"))?.rows[1].values
  ).toEqual([
    "Not included",
    "Included within message allowance",
    "Included within message allowance",
  ]);
});

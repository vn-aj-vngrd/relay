import { describe, expect, it } from "vitest";

import { accountPlanHref } from "./account-plan-policy";
import { billingSection, billingSectionHref } from "./navigation";

describe("billing navigation", () => {
  it("defaults to My plan and tolerates unknown sections", () => {
    expect(billingSection({})).toBe("current");
    expect(billingSection({ section: "unknown" })).toBe("current");
  });

  it("keeps old plan and pagination links working", () => {
    expect(billingSection({ plan: "plus" })).toBe("plans");
    expect(billingSection({ cursor: "cursor" })).toBe("history");
    expect(billingSection({ terms: "cursor" })).toBe("history");
    expect(billingSection({ payments: "1" })).toBe("history");
    expect(
      billingSection({ section: "current", plan: "plus", terms: "cursor" })
    ).toBe("current");
  });

  it("preserves independent history cursors but drops selection outside Plans", () => {
    const query = { cursor: "request", terms: "term", plan: "plus" };
    expect(billingSectionHref("history", query)).toBe(
      "/settings/plan?section=history&cursor=request&terms=term"
    );
    expect(billingSectionHref("plans", query)).toBe(
      "/settings/plan?section=plans&cursor=request&terms=term&plan=plus"
    );
    expect(billingSectionHref("current")).toBe(
      "/settings/plan?section=current"
    );
  });

  it("sends upgrade and discovery hooks to Plans, management to My plan", () => {
    expect(accountPlanHref("Upgrade plan")).toBe(
      "/settings/plan?section=plans"
    );
    expect(accountPlanHref("Explore plans")).toBe(
      "/settings/plan?section=plans"
    );
    expect(accountPlanHref("Plan & billing")).toBe("/settings/plan");
  });
});

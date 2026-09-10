import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { BillingTabs } from "./billing-tabs";

afterEach(cleanup);

describe("BillingTabs", () => {
  it("uses the settings navigation pattern with three URL-backed sections", () => {
    render(<BillingTabs active="plans" query={{ plan: "plus" }} />);
    expect(
      screen.getByRole("navigation", { name: "Plan and billing sections" })
    ).toBeVisible();
    expect(screen.getAllByRole("link").map((link) => link.textContent)).toEqual(
      ["My plan", "Plans", "History"]
    );
    expect(screen.getByRole("link", { name: "Plans" })).toHaveAttribute(
      "aria-current",
      "page"
    );
    expect(screen.getByRole("link", { name: "Plans" })).toHaveAttribute(
      "href",
      "/settings/plan?section=plans&plan=plus"
    );
    expect(screen.getByRole("link", { name: "My plan" })).toHaveAttribute(
      "href",
      "/settings/plan?section=current"
    );
    expect(screen.getByRole("link", { name: "History" })).toHaveAttribute(
      "href",
      "/settings/plan?section=history"
    );
  });
});

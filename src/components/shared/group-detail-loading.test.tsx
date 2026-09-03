import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import GroupLoading from "@/app/(app)/groups/[slug]/loading";

describe("group detail loading state", () => {
  it("preserves the responsive header, memories, and member rail geometry", () => {
    render(<GroupLoading />);

    expect(screen.getByRole("status", { name: "Loading group" })).toBeVisible();
    expect(screen.getByTestId("group-detail-skeleton-header")).toHaveClass(
      "flex-col",
      "sm:flex-row",
      "sm:justify-between"
    );
    expect(
      screen
        .getByTestId("group-detail-skeleton-memories")
        .querySelectorAll("[class*='aspect-']")
    ).toHaveLength(2);
    expect(
      screen.getByRole("region", { name: "Loading group members" })
    ).toBeVisible();
  });
});

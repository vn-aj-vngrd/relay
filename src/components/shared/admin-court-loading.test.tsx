import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import AdminCourtLoading from "@/app/(admin)/admin/courts/[id]/loading";

describe("admin court loading", () => {
  it("marks the skeleton busy without a duplicate visual loading indicator", () => {
    const { container } = render(<AdminCourtLoading />);
    expect(
      screen.getByRole("status", { name: "Loading court record" })
    ).toHaveAttribute("aria-busy", "true");
    expect(screen.queryByText("Loading court record")).not.toBeInTheDocument();
    expect(container.querySelector(".animate-spin")).toBeNull();
    expect(container.querySelector(".animate-pulse")).not.toBeNull();
  });
});

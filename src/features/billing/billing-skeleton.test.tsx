import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { BillingSkeleton } from "./billing-skeleton";

afterEach(cleanup);

describe("BillingSkeleton", () => {
  it.each([
    ["current", "Loading your plan and usage…"],
    ["plans", "Loading available plans…"],
    ["history", "Loading your plan and payment history…"],
  ] as const)(
    "announces %s loading without interactive placeholders",
    (section, label) => {
      render(<BillingSkeleton section={section} />);
      expect(screen.getByRole("status", { name: label })).toBeInTheDocument();
      expect(screen.getByText(label)).toHaveClass("sr-only");
      expect(screen.queryByRole("link")).not.toBeInTheDocument();
      expect(screen.queryByRole("button")).not.toBeInTheDocument();
      expect(
        screen.queryByRole("heading", { level: 1 })
      ).not.toBeInTheDocument();
    }
  );

  it("keeps the Plans introduction as real text", () => {
    render(<BillingSkeleton section="plans" />);
    expect(screen.getByText("Monthly hosting plans")).toBeInTheDocument();
    expect(screen.getByText(/Paid renewal is manual/)).toBeInTheDocument();
  });

  it("reserves separate plan and payment history lists", () => {
    render(<BillingSkeleton section="history" />);
    expect(screen.getByText("Plan history")).toBeInTheDocument();
    expect(screen.getByText("Payment history")).toBeInTheDocument();
  });
});

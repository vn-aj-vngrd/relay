import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("./actions", () => ({ markPaymentSent: vi.fn() }));

import { PaymentProofForm } from "./payment-proof-form";

describe("PaymentProofForm", () => {
  it("lets the containing payment surface own section dividers", () => {
    const { container } = render(
      <PaymentProofForm paymentId="00000000-0000-4000-8000-000000000001" />
    );
    const form = container.querySelector("form");

    expect(screen.getByText("Payment screenshot")).toBeVisible();
    expect(form).not.toHaveClass("border-t", "border-line", "pt-4");
  });
});

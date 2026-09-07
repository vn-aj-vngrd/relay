import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import {
  PaymentSetupFields,
  PlayerPaymentFields,
} from "./payment-setup-fields";
import {
  paymentSetupInput,
  paymentSetupSchema,
  serializableCreationValues,
} from "./setup";

const defaults = {
  label: "Game expenses",
  total: "1200",
  method: "GCash",
  details: "Host account",
};

describe("collection setup fields", () => {
  it("totals multiple expenses and serializes them for the creation draft", () => {
    const { container } = render(
      <form>
        <PaymentSetupFields defaults={defaults} />
      </form>
    );
    fireEvent.click(screen.getByRole("button", { name: "Add expense" }));
    fireEvent.change(screen.getByLabelText("Expense 2"), {
      target: { value: "Balls" },
    });
    fireEvent.change(screen.getAllByLabelText("Amount (₱)")[1], {
      target: { value: "200.25" },
    });
    expect(screen.getByLabelText("Total amount")).toHaveValue(1400.25);
    const data = new FormData(container.querySelector("form")!);
    const parsed = paymentSetupSchema.parse(paymentSetupInput(data));
    expect(parsed.items).toEqual([
      { label: "Game expenses", amountCents: 120000 },
      { label: "Balls", amountCents: 20025 },
    ]);
    expect(serializableCreationValues(data).items).toBe(
      JSON.stringify(parsed.items)
    );
  });
  it("reveals a fixed rate without using roster capacity as an estimate", () => {
    render(<PaymentSetupFields defaults={defaults} />);
    fireEvent.click(
      screen.getByRole("button", { name: "How players contribute" })
    );
    fireEvent.click(
      screen.getByRole("option", { name: "Fixed amount per player" })
    );
    expect(screen.getByLabelText("Fixed amount per player (₱)")).toHaveValue(
      null
    );
    expect(
      screen.getByText(/advertised price before players join/)
    ).toBeVisible();
  });
  it("restores fixed pricing and expense items", () => {
    render(
      <PaymentSetupFields
        defaults={{
          ...defaults,
          contributionMode: "fixed",
          fixedRate: "300.25",
          items: JSON.stringify([
            { label: "Court", amountCents: 90000 },
            { label: "Balls", amountCents: 30000 },
          ]),
        }}
      />
    );
    expect(screen.getByLabelText("Expense 2")).toHaveValue("Balls");
    expect(screen.getByLabelText("Fixed amount per player (₱)")).toHaveValue(
      300.25
    );
    expect(screen.getByLabelText("Total amount")).toHaveValue(1200);
  });
  it("keeps unused collection fields out of a Decide later submission", () => {
    const { container } = render(
      <form>
        <PlayerPaymentFields />
      </form>
    );
    const data = new FormData(container.querySelector("form")!);
    expect(data.get("costKind")).toBe("unspecified");
    expect(data.has("items")).toBe(false);
  });
  it("locks amounts and method without hiding instructions", () => {
    render(
      <PaymentSetupFields
        defaults={{ ...defaults, contributionMode: "fixed", fixedRate: "300" }}
        totalReadOnly
      />
    );
    expect(screen.getByLabelText("Amount (₱)")).toHaveAttribute("readonly");
    expect(
      screen.getByLabelText("Fixed amount per player (₱)")
    ).toHaveAttribute("readonly");
    expect(
      screen.queryByRole("button", { name: "Add expense" })
    ).not.toBeInTheDocument();
    expect(screen.getByLabelText("Payment details")).not.toHaveAttribute(
      "readonly"
    );
  });
});

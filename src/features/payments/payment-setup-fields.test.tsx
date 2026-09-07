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
  it("submits one complete collection from the expanded settings layout", () => {
    const { container } = render(
      <form>
        <PaymentSetupFields expanded defaults={defaults} />
      </form>
    );
    fireEvent.change(screen.getByLabelText("Payment details"), {
      target: { value: "Updated host account" },
    });
    const data = new FormData(container.querySelector("form")!);
    expect(screen.queryByLabelText("Collection name")).not.toBeInTheDocument();
    expect(data.get("label")).toBe("Game expenses");
    expect(data.getAll("total")).toEqual(["1200"]);
    expect(data.getAll("details")).toEqual(["Updated host account"]);
    expect(paymentSetupSchema.parse(paymentSetupInput(data)).items).toEqual([
      { label: "Game expenses", amountCents: 120000 },
    ]);
  });
  it("reveals a fixed rate without using roster capacity as an estimate", () => {
    render(<PaymentSetupFields defaults={defaults} />);
    fireEvent.click(screen.getByRole("button", { name: "Split type" }));
    fireEvent.click(
      screen.getByRole("option", { name: "Fixed amount per player" })
    );
    expect(screen.getByLabelText("Fixed amount per player (₱)")).toHaveValue(
      null
    );
    expect(
      screen.getByText("Same price for each player. You cover any shortfall.")
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
  it("allows breakdown edits while keeping the fixed player rate locked", () => {
    render(
      <PaymentSetupFields
        defaults={{ ...defaults, contributionMode: "fixed", fixedRate: "300" }}
        totalReadOnly
      />
    );
    expect(screen.getByLabelText("Amount (₱)")).not.toHaveAttribute("readonly");
    expect(
      screen.getByLabelText("Fixed amount per player (₱)")
    ).toHaveAttribute("readonly");
    fireEvent.click(screen.getByRole("button", { name: "Add expense" }));
    expect(screen.getByLabelText("Expense 2")).toBeVisible();
    fireEvent.click(screen.getByRole("button", { name: "Remove expense 2" }));
    expect(screen.queryByLabelText("Expense 2")).not.toBeInTheDocument();
    expect(screen.getByLabelText("Payment details")).not.toHaveAttribute(
      "readonly"
    );
  });
});

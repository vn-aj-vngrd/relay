import { fireEvent, render, screen, waitFor } from "@testing-library/react";
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
  it("highlights and focuses only the invalid payment instructions", async () => {
    render(
      <PaymentSetupFields
        defaults={defaults}
        fieldErrors={{ details: "Enter payment instructions." }}
      />
    );
    const details = screen.getByLabelText("Payment details");
    expect(details).toHaveAttribute("aria-invalid", "true");
    expect(details).toHaveClass("border-danger");
    expect(details).toHaveAccessibleDescription("Enter payment instructions.");
    expect(screen.getByLabelText("Expense 1")).toHaveAttribute(
      "aria-invalid",
      "false"
    );
    await waitFor(() => expect(details).toHaveFocus());
    fireEvent.change(details, { target: { value: "Updated account details" } });
    expect(details).toHaveAttribute("aria-invalid", "false");
    expect(
      screen.queryByText("Enter payment instructions.")
    ).not.toBeInTheDocument();
  });
  it("associates expense errors with the correct row and keeps other errors on edit", () => {
    render(
      <PaymentSetupFields
        defaults={{
          ...defaults,
          items: JSON.stringify([
            { label: "Court", amountCents: 100000 },
            { label: "Balls", amountCents: 20000 },
          ]),
        }}
        fieldErrors={{
          "items.1.amountCents": "Check this amount.",
          details: "Add instructions.",
        }}
      />
    );
    const amounts = screen.getAllByLabelText("Amount (₱)");
    expect(amounts[0]).toHaveAttribute("aria-invalid", "false");
    expect(amounts[1]).toHaveAccessibleDescription("Check this amount.");
    fireEvent.change(amounts[1], { target: { value: "250" } });
    expect(amounts[1]).toHaveAttribute("aria-invalid", "false");
    expect(screen.getByLabelText("Payment details")).toHaveAttribute(
      "aria-invalid",
      "true"
    );
  });
  it("does not move a removed row’s error to another expense", () => {
    render(
      <PaymentSetupFields
        defaults={{
          ...defaults,
          items: JSON.stringify([
            { label: "Court", amountCents: 100000 },
            { label: "Balls", amountCents: 20000 },
          ]),
        }}
        fieldErrors={{ "items.1.label": "Check the expense name." }}
      />
    );
    fireEvent.click(screen.getByRole("button", { name: "Remove expense 1" }));
    expect(screen.getByLabelText("Expense 1")).toHaveValue("Balls");
    expect(
      screen.queryByText("Check the expense name.")
    ).not.toBeInTheDocument();
  });
  it("highlights the fixed rate and payment method when invalid", () => {
    render(
      <PaymentSetupFields
        defaults={{ ...defaults, contributionMode: "fixed", fixedRate: "300" }}
        fieldErrors={{
          fixedRate: "Check the rate.",
          method: "Choose a method.",
        }}
      />
    );
    expect(
      screen.getByLabelText("Fixed amount per player (₱)")
    ).toHaveAccessibleDescription("Check the rate.");
    expect(
      screen.getByRole("button", { name: "Payment method" })
    ).toHaveAccessibleDescription("Choose a method.");
    fireEvent.click(screen.getByRole("button", { name: "Payment method" }));
    fireEvent.click(screen.getByRole("option", { name: "Cash" }));
    expect(screen.queryByText("Choose a method.")).not.toBeInTheDocument();
  });
  it("submits only intent when creation chooses Collect payment", () => {
    const { container } = render(
      <form>
        <PlayerPaymentFields choiceOnly defaults={{ costKind: "collect" }} />
      </form>
    );
    expect(
      serializableCreationValues(new FormData(container.querySelector("form")!))
    ).toEqual({ costKind: "collect" });
    expect(screen.queryByLabelText("Total amount")).not.toBeInTheDocument();
    expect(screen.queryByText(/Open games/)).not.toBeInTheDocument();
    expect(screen.getByText(/after creating your game/)).toBeVisible();
  });
  it("removes the public pricing caveat when choosing Free", () => {
    render(<PlayerPaymentFields choiceOnly isPublic />);
    expect(screen.getByText(/It won’t appear in Open games/)).toBeVisible();
    fireEvent.click(screen.getByRole("button", { name: "Payment choice" }));
    fireEvent.click(screen.getByRole("option", { name: "Free" }));
    expect(
      screen.queryByText(/It won’t appear in Open games/)
    ).not.toBeInTheDocument();
    expect(screen.queryByLabelText("Payment details")).not.toBeInTheDocument();
  });
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

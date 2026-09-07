import { render, screen } from "@testing-library/react";
import type { ComponentProps } from "react";
import { describe, expect, it, vi } from "vitest";

vi.mock("./actions", () => ({ togglePaymentExcluded: vi.fn() }));
vi.mock("./payment-management-forms", () => ({
  EditExpenseForm: ({ expenseId }: { expenseId: string }) => (
    <p>Edit {expenseId}</p>
  ),
  PaymentChoiceForm: () => <p>Choose payment</p>,
  PaymentAmountForm: () => <p>Amount editor</p>,
  AssignPlayerShareForm: () => <p>Assign share</p>,
  PaymentAdjustmentResponse: () => null,
}));

import { PaymentSettings } from "./payment-settings";

type SettingsProps = ComponentProps<typeof PaymentSettings>;
const session: SettingsProps["session"] = {
  id: "game",
  hostId: "host",
  status: "published",
  playerPriceCents: 120000,
  bookingTotalCents: null,
};
function collection(id: string): SettingsProps["collections"][number] {
  return {
    expense: {
      id,
      label: id,
      totalCents: 120000,
      contributionMode: "split",
      fixedRateCents: null,
      items: [{ label: "Court", amountCents: 120000 }],
    },
    account: null,
  } as SettingsProps["collections"][number];
}
const share = {
  payment: {
    id: "share",
    expenseId: "first",
    sessionPlayerId: "player",
    amountCents: 120000,
    status: "unpaid",
    amountSource: "automatic",
    adjustmentHistory: [],
    pendingAdjustment: null,
  },
  player: { id: "player", userId: "player", guestName: null },
  profile: { name: "Sam" },
} as SettingsProps["payments"][number];

describe("simplified payment settings", () => {
  it("keeps individual shares out of general payment settings", () => {
    render(
      <PaymentSettings
        session={session}
        isHost
        collections={[collection("first")]}
        payments={[share]}
      />
    );
    expect(screen.queryByText("Sam")).not.toBeInTheDocument();
    expect(screen.queryByText("Adjust amount")).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: "View payments" })).toHaveAttribute(
      "href",
      "/games/game/payments"
    );
    expect(
      screen.queryByText("Add another collection")
    ).not.toBeInTheDocument();
  });

  it("retains separate editors and an explanation for legacy multiple payments", () => {
    render(
      <PaymentSettings
        session={session}
        isHost
        collections={[collection("first"), collection("second")]}
        payments={[]}
      />
    );
    expect(screen.getByText("Edit first")).toBeVisible();
    expect(screen.getByText("Edit second")).toBeVisible();
    expect(
      screen.getByText(/Each keeps its own amounts and proof/)
    ).toBeVisible();
    expect(
      screen.queryByText("Add another collection")
    ).not.toBeInTheDocument();
  });

  it("keeps cancelled settings and player shares read-only", () => {
    render(
      <PaymentSettings
        session={{ ...session, status: "cancelled" }}
        isHost
        collections={[collection("first")]}
        payments={[share]}
      />
    );
    expect(screen.queryByText("Edit first")).not.toBeInTheDocument();
    expect(screen.queryByText("Adjust amount")).not.toBeInTheDocument();
    expect(screen.queryByText("Sam")).not.toBeInTheDocument();
  });
});

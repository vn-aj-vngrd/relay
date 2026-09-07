import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  user: vi.fn(),
  workspace: vi.fn(),
  rows: vi.fn(),
}));
vi.mock("@/features/auth/session", () => ({ requireUser: mocks.user }));
vi.mock("@/features/sessions/queries", () => ({
  getSessionForWorkspace: mocks.workspace,
}));
vi.mock("@/features/payments/actions", () => ({ confirmPayment: vi.fn() }));
vi.mock("@/features/payments/payment-management-forms", () => ({
  PaymentProofRequestForm: () => null,
}));
vi.mock("@/features/payments/payment-proof-form", () => ({
  PaymentProofForm: () => <p>Payment screenshot</p>,
}));
vi.mock("@/lib/supabase/admin", () => ({
  createSupabaseAdminClient: () => ({}),
}));
vi.mock("@/db/client", () => ({
  db: {
    select: () => {
      const selection = {
        from: () => selection,
        innerJoin: () => selection,
        leftJoin: () => selection,
        where: mocks.rows,
      };
      return selection;
    },
  },
}));

import PaymentsPage from "@/app/(app)/games/[id]/payments/page";

const expense = { id: "expense", label: "Court", totalCents: 240000 };
const account = { id: "account", method: "Maya", details: "Host account" };
const workspace = {
  session: {
    id: "game",
    hostId: "host",
    status: "published",
    playerPriceCents: 120000,
  },
  access: "participant",
  membership: { role: "player", rsvp: "waitlisted", leftAt: null },
  roster: [{ player: { role: "host" }, profile: { name: "Host" } }],
};

beforeEach(() => {
  vi.clearAllMocks();
  mocks.rows.mockReset();
  mocks.user.mockResolvedValue({ id: "player" });
  mocks.workspace.mockResolvedValue(workspace);
});

function collections(assigned: boolean) {
  mocks.rows.mockResolvedValueOnce([{ expense, account }]);
  mocks.rows.mockResolvedValueOnce([
    {
      expense,
      payment: { id: "payment", status: "unpaid", amountCents: 120000 },
      player: { userId: assigned ? "player" : "another-player" },
      profile: { name: "Player" },
    },
  ]);
}

describe("authenticated collection tracking", () => {
  it("places the host's primary setup action inside the empty state", async () => {
    mocks.user.mockResolvedValue({ id: "host" });
    mocks.workspace.mockResolvedValue({
      ...workspace,
      access: "host",
      session: { ...workspace.session, playerPriceCents: null },
    });
    mocks.rows.mockResolvedValueOnce([]).mockResolvedValueOnce([]);
    render(await PaymentsPage({ params: Promise.resolve({ id: "game" }) }));
    const heading = screen.getByRole("heading", {
      name: "Payment details aren’t set up",
    });
    const action = screen.getByRole("link", { name: "Set up payments" });
    expect(heading.closest("section")).toContainElement(action);
    expect(action).toHaveClass("bg-primary");
    expect(action).toHaveAttribute(
      "href",
      "/games/game/settings?section=payments#player-payment"
    );
    expect(
      screen.getByText("Add your expenses and choose how players contribute.")
    ).toBeVisible();
    expect(
      screen.getAllByRole("link", { name: "Set up payments" })
    ).toHaveLength(1);
  });

  it("does not offer setup to an ordinary player in the empty state", async () => {
    mocks.rows.mockResolvedValueOnce([]).mockResolvedValueOnce([]);
    render(await PaymentsPage({ params: Promise.resolve({ id: "game" }) }));
    expect(
      screen.queryByRole("link", { name: "Set up payments" })
    ).not.toBeInTheDocument();
  });

  it("keeps a free game's edit action secondary and inside its state", async () => {
    mocks.user.mockResolvedValue({ id: "host" });
    mocks.workspace.mockResolvedValue({
      ...workspace,
      access: "host",
      session: { ...workspace.session, playerPriceCents: 0 },
    });
    mocks.rows.mockResolvedValueOnce([]).mockResolvedValueOnce([]);
    render(await PaymentsPage({ params: Promise.resolve({ id: "game" }) }));
    const action = screen.getByRole("link", { name: "Edit payment settings" });
    expect(
      screen.getByRole("heading", { name: "Free game" }).closest("section")
    ).toContainElement(action);
    expect(action).not.toHaveClass("bg-primary");
  });

  it.each(["waitlisted", "going"])(
    "does not direct an unassigned %s player to pay another player's collection",
    async (rsvp) => {
      mocks.workspace.mockResolvedValue({
        ...workspace,
        membership: { ...workspace.membership, rsvp },
      });
      collections(false);
      render(await PaymentsPage({ params: Promise.resolve({ id: "game" }) }));
      expect(
        screen.getByRole("heading", { name: "No share assigned to you" })
      ).toBeVisible();
      expect(
        screen.getByText(
          "You have no assigned share in the current collection. Ask the host if you need to be included."
        )
      ).toBeVisible();
      expect(screen.queryByText("0 of 0 paid")).not.toBeInTheDocument();
      expect(
        screen.queryByRole("heading", { name: "Repay the host" })
      ).not.toBeInTheDocument();
      expect(
        screen.queryByText(/Send your share to the host/)
      ).not.toBeInTheDocument();
      expect(screen.queryByText("Host account")).not.toBeInTheDocument();
    }
  );

  it("retains the shared pending-share explanation before a price exists", async () => {
    mocks.workspace.mockResolvedValue({
      ...workspace,
      session: { ...workspace.session, playerPriceCents: null },
    });
    collections(false);
    render(await PaymentsPage({ params: Promise.resolve({ id: "game" }) }));
    expect(
      screen.getByText(
        "Player share will be calculated when players join. Payment collection is set up."
      )
    ).toBeVisible();
    expect(
      screen.queryByText(/Send your share to the host/)
    ).not.toBeInTheDocument();
  });

  it("retains repayment instructions and proof submission for an assigned player", async () => {
    collections(true);
    render(await PaymentsPage({ params: Promise.resolve({ id: "game" }) }));
    expect(
      screen.getByRole("heading", { name: "Repay the host" })
    ).toBeVisible();
    expect(screen.getByText("0 of 1 paid")).toBeVisible();
    expect(screen.getByText("Payment screenshot")).toBeVisible();
    expect(
      screen.queryByRole("heading", { name: "No share assigned to you" })
    ).not.toBeInTheDocument();
  });

  it("keeps collection tracking available to the host who never owes a player share", async () => {
    mocks.user.mockResolvedValue({ id: "host" });
    mocks.workspace.mockResolvedValue({ ...workspace, access: "host" });
    collections(false);
    render(await PaymentsPage({ params: Promise.resolve({ id: "game" }) }));
    expect(screen.getByText("0 of 1 paid")).toBeVisible();
    expect(
      screen.getByText(/Players send their shares and upload proof/)
    ).toBeVisible();
    expect(
      screen.queryByRole("heading", { name: "No share assigned to you" })
    ).not.toBeInTheDocument();
  });
});

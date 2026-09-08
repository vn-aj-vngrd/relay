import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  user: vi.fn(),
  workspace: vi.fn(),
  publicSession: vi.fn(),
  viewer: vi.fn(),
  rows: vi.fn(),
}));
vi.mock("@/features/auth/session", () => ({ requireUser: mocks.user }));
vi.mock("@/features/sessions/queries", () => ({
  getSessionForWorkspace: mocks.workspace,
  getPublicSession: mocks.publicSession,
}));
vi.mock("@/features/sessions/viewer", () => ({
  getSessionViewer: mocks.viewer,
  canParticipate: (rsvp: string) => rsvp === "going",
}));
vi.mock("@/features/payments/actions", () => ({
  confirmPayment: vi.fn(),
  togglePaymentExcluded: vi.fn(),
}));
vi.mock("@/features/payments/payment-management-forms", () => ({
  PaymentProofRequestForm: () => null,
  PaymentAmountForm: () => <p>Amount editor</p>,
  AssignPlayerShareForm: () => <p>Assign share</p>,
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
import PublicPaymentsPage from "@/app/s/[slug]/payments/page";

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
  it.each([false, true])(
    "shows Free and retained history without payable controls (shared: %s)",
    async (shared) => {
      const archived = { ...expense, archivedAt: new Date() };
      const payment = {
        id: "old-payment",
        expenseId: expense.id,
        sessionPlayerId: "player-id",
        status: "unpaid",
        amountCents: 120000,
        pendingAdjustment: null,
        adjustmentHistory: [],
      };
      const data = {
        ...workspace,
        session: { ...workspace.session, playerPriceCents: 0 },
      };
      if (shared) {
        mocks.publicSession.mockResolvedValue(data);
        mocks.viewer.mockResolvedValue({
          player: { id: "player-id", userId: "player", rsvp: "going" },
        });
        mocks.rows.mockResolvedValueOnce([
          { expense: archived, account, payment, playerUserId: "player" },
        ]);
        render(
          await PublicPaymentsPage({
            params: Promise.resolve({ slug: "shared" }),
          })
        );
      } else {
        mocks.workspace.mockResolvedValue(data);
        mocks.rows
          .mockResolvedValueOnce([{ expense: archived, account }])
          .mockResolvedValueOnce([
            {
              expense: archived,
              payment,
              player: { userId: "player" },
              profile: { name: "Player" },
            },
          ]);
        render(await PaymentsPage({ params: Promise.resolve({ id: "game" }) }));
      }
      expect(screen.getByRole("heading", { name: "Free game" })).toBeVisible();
      expect(
        screen.getByRole("heading", { name: "Payment history" })
      ).toBeVisible();
      expect(
        screen.getByText("Request cancelled · No payment due")
      ).toBeInTheDocument();
      expect(screen.queryByText("Payment screenshot")).not.toBeInTheDocument();
      expect(
        screen.queryByText("Pay the host, then upload proof.")
      ).not.toBeInTheDocument();
    }
  );
  it("renders the host profile photo using the roster avatar", async () => {
    mocks.workspace.mockResolvedValue({
      ...workspace,
      roster: [
        {
          player: { role: "host" },
          profile: {
            name: "Host",
            avatarPath:
              "https://relay.supabase.co/storage/v1/object/public/avatars/host-avatar.png",
          },
        },
      ],
    });
    collections(true);
    render(await PaymentsPage({ params: Promise.resolve({ id: "game" }) }));
    const avatar = screen.getByRole("img", { name: "Host" });
    expect(avatar.querySelector("img")).toHaveAttribute(
      "src",
      expect.stringContaining("host-avatar.png")
    );
  });

  it("falls back to initials when the host has no profile photo", async () => {
    collections(true);
    render(await PaymentsPage({ params: Promise.resolve({ id: "game" }) }));
    const avatar = screen.getByRole("img", { name: "Host" });
    expect(avatar).toHaveTextContent("H");
    expect(avatar.querySelector("img")).toBeNull();
  });

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
      screen.getByText("Add expenses and choose how players split the cost.")
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
    const action = screen.getByRole("link", { name: "Edit payment" });
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
        screen.queryByRole("heading", { name: "Payment details" })
      ).not.toBeInTheDocument();
      expect(
        screen.queryByText("Pay the host, then upload proof.")
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
      screen.queryByText("Pay the host, then upload proof.")
    ).not.toBeInTheDocument();
  });

  it("retains repayment instructions and proof submission for an assigned player", async () => {
    collections(true);
    render(await PaymentsPage({ params: Promise.resolve({ id: "game" }) }));
    expect(
      screen.getByRole("heading", { name: "Payment details" })
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
    const collectionHeading = screen.getByRole("heading", { name: "Court" });
    expect(collectionHeading).toBeVisible();
    const settingsLink = screen.getByRole("link", { name: "Edit payment" });
    expect(collectionHeading.closest("header")).toContainElement(settingsLink);
    expect(settingsLink).toHaveAttribute(
      "href",
      "/games/game/settings?section=payments#player-payment"
    );
    expect(
      screen.getByRole("heading", { name: "Player payments" })
    ).toBeVisible();
    expect(
      screen.getByRole("heading", { name: "Payment details" })
    ).toBeVisible();
    expect(screen.getByText("Split equally")).toBeVisible();
    const adjustment = screen.getByText("Adjust amount").closest("details");
    expect(adjustment).not.toHaveAttribute("open");
    expect(adjustment).toContainElement(screen.getByText("Amount editor"));
    expect(
      screen.queryByText("Pay the host, then upload proof.")
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("heading", { name: "No share assigned to you" })
    ).not.toBeInTheDocument();
  });
});

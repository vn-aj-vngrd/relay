import { ButtonLink } from "@/components/ui/button";
import { SubmitButton } from "@/components/ui/submit-button";
import type {
  expenses,
  paymentAccounts,
  playerPayments,
  profiles,
  sessionPlayers,
} from "@/db/schema";
import { togglePaymentExcluded } from "./actions";
import { hasPaymentHistory } from "./domain";
import {
  CollectionBalance,
  PaymentAdjustmentDetails,
  PaymentBreakdown,
  paymentMoney as peso,
} from "./payment-breakdown";
import {
  AssignPlayerShareForm,
  CreateExpenseForm,
  EditExpenseForm,
  PaymentAmountForm,
  PaymentChoiceForm,
} from "./payment-management-forms";

export function PaymentSettings({
  session,
  collections,
  payments,
  isHost,
  roster = [],
}: {
  session: {
    id: string;
    status: string;
    playerPriceCents: number | null;
    bookingTotalCents: number | null;
    hostId: string;
  };
  collections: {
    expense: typeof expenses.$inferSelect;
    account: typeof paymentAccounts.$inferSelect | null;
  }[];
  payments: {
    payment: typeof playerPayments.$inferSelect;
    player: typeof sessionPlayers.$inferSelect;
    profile: typeof profiles.$inferSelect | null;
  }[];
  isHost: boolean;
  roster?: Array<{ id: string; name: string }>;
}) {
  const open = session.status !== "cancelled";
  return (
    <section
      id="player-payment"
      aria-labelledby="player-payment-heading"
      className="mt-7 flex max-w-2xl flex-col gap-6"
    >
      <div>
        <h2 id="player-payment-heading" className="text-lg font-bold">
          Player payment
        </h2>
        <p className="mt-2 text-sm text-muted">
          Break down your expenses, then split them or set a fixed contribution.
          The host is excluded from player shares. Price changes notify
          signed-in players.
        </p>
      </div>
      <ButtonLink href={`/games/${session.id}/payments`} variant="secondary">
        View payments
      </ButtonLink>
      {!open ? (
        <p className="text-sm text-muted">
          This game was cancelled. Payment records remain visible; changes are
          closed.
        </p>
      ) : null}
      {collections.length ? (
        <p className="text-sm text-muted">
          This game has payment records. You can edit payment details, but
          cannot mark it free or unset. No records are removed and Relay does
          not issue refunds.
        </p>
      ) : null}
      {collections.length && session.playerPriceCents == null ? (
        <p className="text-sm text-muted">
          Player share will be calculated when players join. The public listing
          waits for a player price.
        </p>
      ) : null}
      {!collections.length ? (
        <>
          <p className="text-sm text-muted">
            {session.playerPriceCents === 0
              ? "This game is Free. No payment is needed."
              : "Payment is not set up yet."}
          </p>
          {open && isHost ? (
            <PaymentChoiceForm
              sessionId={session.id}
              price={session.playerPriceCents}
              bookingTotalCents={session.bookingTotalCents}
            />
          ) : (
            <p className="text-sm text-muted">
              Only the host can set up repayment collections.
            </p>
          )}
        </>
      ) : null}
      {collections.map(({ expense, account }) => (
        <article
          key={expense.id}
          className="flex flex-col gap-4 border-t border-line pt-6"
        >
          <h3 className="font-semibold">
            {expense.label} · {peso(expense.totalCents)}
          </h3>
          <PaymentBreakdown expense={expense} />
          <CollectionBalance
            expenseTotalCents={expense.totalCents}
            expectedCents={payments
              .filter(
                ({ payment }) =>
                  payment.expenseId === expense.id &&
                  payment.status !== "excluded"
              )
              .reduce((sum, { payment }) => sum + payment.amountCents, 0)}
          />
          {payments.some(
            ({ payment }) =>
              payment.expenseId === expense.id &&
              (payment.amountSource === "legacy" || hasPaymentHistory(payment))
          ) && expense.contributionMode !== "fixed" ? (
            <p className="text-sm text-muted">
              This split contains historical or reviewed shares. Automatic
              recalculation is paused to protect them; ask the host to review
              any unassigned players.
            </p>
          ) : null}
          {open && isHost ? (
            <EditExpenseForm
              sessionId={session.id}
              expenseId={expense.id}
              contributionReadOnly={
                collections.length > 1 || payments.length > 0
              }
              totalReadOnly={payments.some(
                ({ payment }) => payment.expenseId === expense.id
              )}
              defaults={{
                label: expense.label,
                total: String(expense.totalCents / 100),
                items: JSON.stringify(expense.items ?? []),
                contributionMode: expense.contributionMode ?? "split",
                fixedRate:
                  expense.fixedRateCents == null
                    ? ""
                    : String(expense.fixedRateCents / 100),
                method: account?.method ?? "GCash",
                details: account?.details ?? "",
              }}
            />
          ) : (
            <p className="whitespace-pre-wrap text-sm text-muted">
              {account?.method}
              {"\n"}
              {account?.details}
            </p>
          )}
          <ul className="divide-y divide-line">
            {payments
              .filter(
                ({ payment, player }) =>
                  payment.expenseId === expense.id &&
                  player.userId !== session.hostId
              )
              .map(({ payment, player, profile }) => (
                <li key={payment.id} className="flex flex-col gap-3 py-4">
                  <p className="text-sm font-semibold">
                    {profile?.name ?? player.guestName ?? "Guest"} ·{" "}
                    {peso(payment.amountCents)} ·{" "}
                    {payment.status === "excluded"
                      ? "Not included"
                      : payment.status}
                  </p>
                  <PaymentAdjustmentDetails payment={payment} />
                  {open &&
                  !hasPaymentHistory(payment) &&
                  !payment.pendingAdjustment ? (
                    <div className="flex flex-wrap gap-3">
                      {payment.status !== "excluded" ? (
                        <PaymentAmountForm
                          paymentId={payment.id}
                          name={profile?.name ?? player.guestName ?? "Guest"}
                          amount={payment.amountCents / 100}
                        />
                      ) : null}
                      <form noValidate action={togglePaymentExcluded}>
                        <input
                          type="hidden"
                          name="paymentId"
                          value={payment.id}
                        />
                        <SubmitButton
                          variant="secondary"
                          pendingLabel="Updating…"
                        >
                          {payment.status === "excluded"
                            ? "Include in split"
                            : "Exclude from split"}
                        </SubmitButton>
                      </form>
                    </div>
                  ) : null}
                </li>
              ))}
          </ul>
          {open &&
          roster.some(
            (player) =>
              !payments.some(
                ({ payment }) =>
                  payment.expenseId === expense.id &&
                  payment.sessionPlayerId === player.id
              )
          ) ? (
            <details className="border-t border-line pt-3">
              <summary className="cursor-pointer py-2 text-sm font-semibold">
                Assign a missing share
              </summary>
              <AssignPlayerShareForm
                sessionId={session.id}
                expenseId={expense.id}
                players={roster.filter(
                  (player) =>
                    !payments.some(
                      ({ payment }) =>
                        payment.expenseId === expense.id &&
                        payment.sessionPlayerId === player.id
                    )
                )}
              />
            </details>
          ) : null}
        </article>
      ))}
      {open &&
      isHost &&
      collections.length &&
      !(
        collections.some(
          ({ expense }) => expense.contributionMode === "fixed"
        ) && payments.length
      ) ? (
        <details className="border-t border-line pt-5">
          <summary className="cursor-pointer py-2 text-sm font-semibold">
            Add another collection
          </summary>
          <CreateExpenseForm
            sessionId={session.id}
            bookingTotalCents={session.bookingTotalCents}
            contributionMode={collections[0].expense.contributionMode}
          />
        </details>
      ) : null}
    </section>
  );
}

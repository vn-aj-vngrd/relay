import {
  CheckCircle,
  CircleDashed,
  CurrencyCircleDollar,
  Image as ImageIcon,
} from "@phosphor-icons/react/dist/ssr";
import { eq } from "drizzle-orm";
import Image from "next/image";
import { notFound } from "next/navigation";

import { Avatar } from "@/components/shared/avatar-stack";
import { GamePageIntro } from "@/components/shared/game-page-intro";
import { ButtonLink } from "@/components/ui/button";
import { SubmitButton } from "@/components/ui/submit-button";
import { db } from "@/db/client";
import {
  expenses,
  paymentAccounts,
  playerPayments,
  profiles,
  sessionPlayers,
} from "@/db/schema";
import { can, sessionActor } from "@/features/auth/permissions";
import { requireUser } from "@/features/auth/session";
import { confirmPayment } from "@/features/payments/actions";
import { isActiveCollection } from "@/features/payments/collection-lifecycle";
import {
  PaymentAdjustmentDetails,
  PaymentBreakdown,
  PaymentCollectionProgress,
  PaymentSplitType,
  paymentMoney as peso,
} from "@/features/payments/payment-breakdown";
import { PaymentHistory } from "@/features/payments/payment-history";
import {
  AssignPlayerShareForm,
  PaymentProofRequestForm,
} from "@/features/payments/payment-management-forms";
import { PaymentProofForm } from "@/features/payments/payment-proof-form";
import { PaymentShareControls } from "@/features/payments/payment-share-controls";
import { profileAvatarUrl } from "@/features/players/avatar";
import { getSessionForWorkspace } from "@/features/sessions/queries";
import { canParticipateInWorkspace } from "@/features/sessions/session-access";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

function paymentLabel(status: string, requested: boolean, amountCents: number) {
  if (status === "confirmed") return "Paid";
  if (status === "sent") return "Proof sent";
  if (status === "excluded") return "Not included";
  if (amountCents === 0) return "No payment due";
  return requested ? "New proof requested" : "Unpaid";
}

export default async function PaymentsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await requireUser();
  const sessionId = (await params).id;
  const data = await getSessionForWorkspace(sessionId, user.id);
  if (!data) notFound();
  if (!canParticipateInWorkspace(data.access))
    return (
      <>
        <GamePageIntro title="Payments" />
        <section className="mx-auto w-full max-w-xl border-y border-line py-10 text-center">
          <CurrencyCircleDollar
            aria-hidden
            size={26}
            className="mx-auto text-primary"
          />
          <h2 className="mt-4 text-xl font-bold">
            {data.access === "pending"
              ? "Waiting for host approval"
              : "Payments are for players"}
          </h2>
          <p className="mt-2 leading-7 text-muted">
            {data.access === "pending"
              ? "Payment details will unlock if the host approves your request."
              : "Join the game first to see the host’s payment details and your assigned share."}
          </p>
          <ButtonLink
            href={`/games/${sessionId}`}
            variant="secondary"
            className="mt-6"
          >
            {data.access === "pending"
              ? "View approval status"
              : "Join on Overview"}
          </ButtonLink>
        </section>
      </>
    );
  const actor = sessionActor({
    userId: user.id,
    hostId: data.session.hostId,
    membership: data.membership,
  });
  const cancelled = data.session.status === "cancelled";
  const canManagePayments = !cancelled && can(actor, "confirm_payment");
  const canCreateExpense = !cancelled && can(actor, "create_expense");
  const hostProfile = data.roster.find(
    ({ player }) => player.role === "host"
  )?.profile;
  const hostName = hostProfile?.name ?? "The host";
  const allExpenses = await db
    .select({ expense: expenses, account: paymentAccounts })
    .from(expenses)
    .leftJoin(
      paymentAccounts,
      eq(expenses.paymentAccountId, paymentAccounts.id)
    )
    .where(eq(expenses.sessionId, sessionId));
  const sessionExpenses = allExpenses.filter(({ expense }) =>
    isActiveCollection(expense)
  );
  const rows = await db
    .select({
      payment: playerPayments,
      player: sessionPlayers,
      profile: profiles,
      expense: expenses,
    })
    .from(playerPayments)
    .innerJoin(
      sessionPlayers,
      eq(playerPayments.sessionPlayerId, sessionPlayers.id)
    )
    .leftJoin(profiles, eq(sessionPlayers.userId, profiles.userId))
    .innerJoin(expenses, eq(playerPayments.expenseId, expenses.id))
    .where(eq(expenses.sessionId, sessionId));
  const supabase = createSupabaseAdminClient();
  const collectibleRows = rows.filter(
    ({ player }) => player.userId !== data.session.hostId
  );
  const visibleRows = can(actor, "confirm_payment")
    ? collectibleRows
    : collectibleRows.filter(({ player }) => player.userId === user.id);
  const visiblePayments = await Promise.all(
    visibleRows.map(async (row) => ({
      ...row,
      proofUrl: row.payment.proofStoragePath
        ? ((
            await supabase.storage
              .from("payment-proofs")
              .createSignedUrl(row.payment.proofStoragePath, 3600)
          ).data?.signedUrl ?? null)
        : null,
    }))
  );
  const qrUrls = new Map<string, string>();
  const receiptUrls = new Map<string, string>();
  await Promise.all(
    allExpenses.flatMap(({ expense, account }) => [
      account?.qrStoragePath && isActiveCollection(expense)
        ? supabase.storage
            .from("payment-qrs")
            .createSignedUrl(account.qrStoragePath, 3600)
            .then(({ data: signed }) => {
              if (signed?.signedUrl) qrUrls.set(account.id, signed.signedUrl);
            })
        : Promise.resolve(),
      expense.receiptStoragePath
        ? supabase.storage
            .from("booking-screenshots")
            .createSignedUrl(expense.receiptStoragePath, 3600)
            .then(({ data: signed }) => {
              if (signed?.signedUrl)
                receiptUrls.set(expense.id, signed.signedUrl);
            })
        : Promise.resolve(),
    ])
  );

  return (
    <>
      <GamePageIntro title={canManagePayments ? "Payments" : "Your payment"} />
      {sessionExpenses.length && data.session.playerPriceCents == null ? (
        <p className="mb-6 text-sm text-muted">
          Player share is pending. This game stays out of Open games until a
          price is available.
        </p>
      ) : null}
      {cancelled ? (
        <p
          role="status"
          className="mt-5 border-y border-line bg-surface-raised px-4 py-3 text-sm text-muted"
        >
          This game was cancelled. Payment records remain visible, but
          submissions and changes are closed.
        </p>
      ) : null}
      {sessionExpenses.length ? (
        <div className="w-full min-w-0">
          <section className="min-w-0 space-y-10">
            {sessionExpenses.map(({ expense, account }, index) => {
              const expensePayments = visiblePayments.filter(
                (row) => row.expense.id === expense.id
              );
              const missingPlayers = canManagePayments
                ? data.roster
                    .filter(
                      ({ player }) =>
                        player.rsvp === "going" &&
                        !player.leftAt &&
                        player.userId !== data.session.hostId &&
                        !expensePayments.some(
                          (row) => row.player.id === player.id
                        )
                    )
                    .map(({ player, profile }) => ({
                      id: player.id,
                      name: profile?.name ?? player.guestName ?? "Guest",
                    }))
                : [];
              const unassigned =
                !canManagePayments &&
                user.id !== data.session.hostId &&
                expensePayments.length === 0;
              const confirmed = expensePayments.filter(
                (row) => row.payment.status === "confirmed"
              ).length;
              return (
                <article key={expense.id} className="min-w-0">
                  <header className="flex flex-wrap items-end justify-between gap-4 border-b border-line pb-5">
                    <div>
                      <h2 className="break-words text-lg font-semibold">
                        {expense.label}
                      </h2>
                      <p className="score mt-1 text-2xl font-bold">
                        {peso(expense.totalCents)}{" "}
                        <span className="text-base font-medium text-muted">
                          total
                        </span>
                      </p>
                      <PaymentSplitType expense={expense} />
                    </div>
                    <div className="flex flex-wrap items-center gap-3">
                      {!unassigned ? (
                        <p className="text-sm text-muted">
                          {confirmed} of {expensePayments.length} paid
                        </p>
                      ) : null}
                      {index === 0 &&
                      (canManagePayments || canCreateExpense) ? (
                        <ButtonLink
                          href={`/games/${sessionId}/settings?section=payments#player-payment`}
                          variant="secondary"
                        >
                          Edit payment
                        </ButtonLink>
                      ) : null}
                    </div>
                  </header>
                  <div className="grid min-w-0 gap-6 pt-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,20rem)] lg:gap-8">
                    <div className="min-w-0">
                      <h3 className="text-sm font-semibold">
                        {canManagePayments ? "Player payments" : "Your payment"}
                      </h3>
                      <div className="flex min-h-16 items-center gap-3 border-b border-line py-3">
                        <Avatar
                          name={hostName}
                          imageUrl={profileAvatarUrl(hostProfile?.avatarPath)}
                          size="sm"
                        />
                        <div className="min-w-0 flex-1">
                          <p className="break-words font-[650]">{hostName}</p>
                          <p className="mt-0.5 text-xs text-muted">
                            Host · paid upfront
                          </p>
                        </div>
                        <span className="text-sm font-semibold text-success">
                          Paid
                        </span>
                      </div>
                      <ul className="divide-y divide-line">
                        {expensePayments.map(
                          ({ payment, player, profile, proofUrl }) => {
                            const own = player.userId === user.id;
                            const name =
                              profile?.name ?? player.guestName ?? "Guest";
                            const requested = Boolean(payment.reviewNote);
                            return (
                              <li key={payment.id} className="py-4">
                                <div className="flex flex-wrap items-center gap-3">
                                  <span className="min-w-0 basis-32 flex-1 break-words font-medium">
                                    {name}
                                  </span>
                                  <span className="score text-sm font-semibold">
                                    {peso(payment.amountCents)}
                                  </span>
                                  <span
                                    className={`inline-flex items-center gap-1.5 text-sm font-medium ${payment.status === "confirmed" ? "text-success" : requested ? "text-warning" : "text-muted"}`}
                                  >
                                    {payment.status === "confirmed" ? (
                                      <CheckCircle aria-hidden size={16} />
                                    ) : (
                                      <CircleDashed aria-hidden size={16} />
                                    )}
                                    {paymentLabel(
                                      payment.status,
                                      requested,
                                      payment.amountCents
                                    )}
                                  </span>
                                </div>
                                <PaymentAdjustmentDetails
                                  payment={payment}
                                  canRespond={!cancelled && own}
                                />
                                {canManagePayments ? (
                                  <PaymentShareControls
                                    payment={payment}
                                    name={name}
                                  />
                                ) : null}
                                {!cancelled &&
                                !payment.pendingAdjustment &&
                                own &&
                                payment.amountCents > 0 &&
                                payment.status === "unpaid" ? (
                                  <PaymentProofForm
                                    paymentId={payment.id}
                                    reviewNote={payment.reviewNote}
                                  />
                                ) : null}
                                {payment.status === "sent" ? (
                                  <div className="mt-3 flex flex-wrap items-start gap-3 rounded-lg bg-surface-strong p-3">
                                    {proofUrl ? (
                                      <a
                                        href={proofUrl}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="overflow-hidden rounded-lg"
                                      >
                                        <Image
                                          src={proofUrl}
                                          alt={`Payment proof from ${name}`}
                                          width={88}
                                          height={88}
                                          className="h-[88px] w-[88px] object-cover"
                                        />
                                      </a>
                                    ) : (
                                      <span className="grid h-[88px] w-[88px] place-items-center rounded-lg bg-surface text-muted">
                                        <ImageIcon aria-hidden />
                                      </span>
                                    )}
                                    <div className="min-w-0 basis-48 flex-1">
                                      <p className="text-sm font-[650]">
                                        Waiting for host review
                                      </p>
                                      <p className="mt-1 text-xs leading-5 text-muted">
                                        Confirm after checking the proof.
                                      </p>
                                      {canManagePayments ? (
                                        <div className="mt-3 flex flex-wrap items-start gap-2">
                                          <form
                                            noValidate
                                            action={confirmPayment}
                                          >
                                            <input
                                              type="hidden"
                                              name="paymentId"
                                              value={payment.id}
                                            />
                                            <SubmitButton pendingLabel="Confirming…">
                                              Confirm paid
                                            </SubmitButton>
                                          </form>
                                          <details>
                                            <summary className="pressable inline-flex min-h-9 cursor-pointer items-center rounded-lg border border-line bg-surface px-3 text-[13px] font-[600] leading-none text-ink hover:bg-surface-strong">
                                              Request new proof
                                            </summary>
                                            <PaymentProofRequestForm
                                              paymentId={payment.id}
                                            />
                                          </details>
                                        </div>
                                      ) : null}
                                    </div>
                                  </div>
                                ) : null}
                              </li>
                            );
                          }
                        )}
                      </ul>
                      {missingPlayers.length ? (
                        <details className="mt-3 border-t border-line pt-3">
                          <summary className="min-h-9 cursor-pointer py-2 text-sm font-medium text-primary">
                            Assign a missing share
                          </summary>
                          <AssignPlayerShareForm
                            sessionId={sessionId}
                            expenseId={expense.id}
                            players={missingPlayers}
                          />
                        </details>
                      ) : null}
                    </div>
                    <div className="min-w-0 space-y-6 border-t border-line pt-5 lg:border-l lg:border-t-0 lg:pl-8 lg:pt-0">
                      <PaymentBreakdown expense={expense} />
                      <PaymentCollectionProgress
                        expenseTotalCents={expense.totalCents}
                        payments={collectibleRows
                          .filter((row) => row.expense.id === expense.id)
                          .map(({ payment }) => payment)}
                      />
                      {unassigned ? (
                        <section className="mt-5 border-t border-line py-5">
                          <h2 className="font-bold">
                            No share assigned to you
                          </h2>
                          <p className="mt-2 text-sm text-muted">
                            {data.session.playerPriceCents == null
                              ? "Player share will be calculated when players join. Payment collection is set up."
                              : "You have no assigned share in the current collection. Ask the host if you need to be included."}
                          </p>
                        </section>
                      ) : canManagePayments ||
                        expensePayments.some(
                          ({ payment }) =>
                            payment.amountCents > 0 &&
                            payment.status !== "excluded" &&
                            !payment.pendingAdjustment
                        ) ? (
                        <section className="mt-5 border-t border-line py-5">
                          <h3 className="font-semibold">Payment details</h3>
                          <p className="mt-2 text-sm font-medium">
                            {account?.method}
                          </p>
                          <p className="mt-1 whitespace-pre-wrap break-words text-sm leading-5 text-muted">
                            {account?.details}
                          </p>
                          {account && qrUrls.get(account.id) ? (
                            <Image
                              src={qrUrls.get(account.id)!}
                              alt={`${account.method} payment QR`}
                              width={240}
                              height={240}
                              className="mt-4 aspect-square w-full max-w-60 rounded-lg border border-line object-contain"
                            />
                          ) : null}
                          {receiptUrls.get(expense.id) ? (
                            <a
                              href={receiptUrls.get(expense.id)!}
                              target="_blank"
                              rel="noreferrer"
                              className="mt-5 flex items-center gap-3 border-t border-line pt-4"
                            >
                              <Image
                                src={receiptUrls.get(expense.id)!}
                                alt="Receipt uploaded by the host"
                                width={48}
                                height={48}
                                className="h-12 w-12 rounded-md border border-line object-cover"
                              />
                              <span>
                                <strong className="block text-sm">
                                  View host receipt
                                </strong>
                              </span>
                            </a>
                          ) : null}
                          {!canManagePayments ? (
                            <p className="mt-3 text-xs text-muted">
                              Pay the host, then upload proof.
                            </p>
                          ) : null}
                        </section>
                      ) : null}
                    </div>
                  </div>
                </article>
              );
            })}
          </section>
        </div>
      ) : (
        <section className="mx-auto max-w-xl py-4 sm:py-14">
          <CircleDashed className="text-primary" />
          <h2 className="mt-4 text-xl font-bold">
            {data.session.playerPriceCents === 0
              ? "Free game"
              : "Payment details aren’t set up"}
          </h2>
          <p className="mt-2 text-pretty text-muted">
            {data.session.playerPriceCents === 0
              ? "The host marked this game Free. No repayment is needed."
              : data.session.playerPriceCents
                ? `The current player price is ${peso(data.session.playerPriceCents)}. The host hasn’t requested payment yet.`
                : canCreateExpense
                  ? "Add expenses and choose how players split the cost."
                  : "The host hasn’t added a repayment amount or payment method yet."}
          </p>
          {canCreateExpense ? (
            <ButtonLink
              href={`/games/${sessionId}/settings?section=payments#player-payment`}
              variant={
                data.session.playerPriceCents === 0 ? "secondary" : "primary"
              }
              className="mt-6"
            >
              {data.session.playerPriceCents === 0
                ? "Edit payment"
                : "Set up payments"}
            </ButtonLink>
          ) : null}
        </section>
      )}
      <PaymentHistory
        collections={allExpenses
          .filter(({ expense }) => !isActiveCollection(expense))
          .map(({ expense }) => ({
            expense,
            receiptUrl: receiptUrls.get(expense.id),
          }))}
        payments={visiblePayments.map(
          ({ payment, player, profile, proofUrl }) => ({
            payment,
            name: profile?.name ?? player.guestName ?? "Guest",
            proofUrl,
          })
        )}
      />
    </>
  );
}

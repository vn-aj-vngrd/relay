import {
  CheckCircle,
  CircleDashed,
  CurrencyCircleDollar,
} from "@phosphor-icons/react/dist/ssr";
import { eq } from "drizzle-orm";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";

import { db } from "@/db/client";
import {
  expenses,
  paymentAccounts,
  playerPayments,
  sessionPlayers,
} from "@/db/schema";
import { isActiveCollection } from "@/features/payments/collection-lifecycle";
import {
  PaymentAdjustmentDetails,
  PaymentBreakdown,
  PaymentCollectionProgress,
  PaymentSplitType,
  paymentMoney as peso,
} from "@/features/payments/payment-breakdown";
import { PaymentHistory } from "@/features/payments/payment-history";
import { PaymentProofForm } from "@/features/payments/payment-proof-form";
import { sessionAccentStyle } from "@/features/sessions/accent";
import { getPublicSession } from "@/features/sessions/queries";
import { canParticipate, getSessionViewer } from "@/features/sessions/viewer";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export default async function PublicPaymentsPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const slug = (await params).slug;
  const data = await getPublicSession(slug);
  if (!data) notFound();
  const viewer = await getSessionViewer(data.session.id, slug);
  const cancelled = data.session.status === "cancelled";
  const canView = Boolean(viewer && canParticipate(viewer.player.rsvp));
  if (!canView)
    return (
      <main
        id="main-content"
        className="public-session-page min-h-screen bg-surface"
        style={sessionAccentStyle(data.session.accentColor)}
      >
        <div className="public-session-content mx-auto w-full max-w-xl bg-surface px-4 py-4 text-center sm:px-6 sm:py-14">
          <CurrencyCircleDollar
            aria-hidden
            size={26}
            className="mx-auto text-primary"
          />
          <h1 className="mt-4 text-2xl font-bold">Payments are for players</h1>
          <p className="mt-2 leading-7 text-muted">
            Join the game first to see the host’s payment details and your
            assigned share.
          </p>
          <Link
            href={`/s/${slug}`}
            className="mt-6 inline-flex min-h-11 items-center font-semibold text-primary"
          >
            Join on the plan
          </Link>
        </div>
      </main>
    );

  const allRows = await db
    .select({
      expense: expenses,
      account: paymentAccounts,
      payment: playerPayments,
      playerUserId: sessionPlayers.userId,
    })
    .from(expenses)
    .leftJoin(
      paymentAccounts,
      eq(expenses.paymentAccountId, paymentAccounts.id)
    )
    .leftJoin(playerPayments, eq(playerPayments.expenseId, expenses.id))
    .leftJoin(
      sessionPlayers,
      eq(playerPayments.sessionPlayerId, sessionPlayers.id)
    )
    .where(eq(expenses.sessionId, data.session.id));
  const rows = allRows.filter(({ expense }) => isActiveCollection(expense));
  const ownRows = allRows.filter(
    ({ payment }) => payment?.sessionPlayerId === viewer!.player.id
  );
  const supabase = createSupabaseAdminClient();
  const allItems = await Promise.all(
    ownRows.map(async (row) => ({
      ...row,
      proofUrl:
        row.expense.archivedAt && row.payment?.proofStoragePath
          ? ((
              await supabase.storage
                .from("payment-proofs")
                .createSignedUrl(row.payment.proofStoragePath, 3600)
            ).data?.signedUrl ?? null)
          : null,
      qrUrl:
        !row.expense.archivedAt && row.account?.qrStoragePath
          ? ((
              await supabase.storage
                .from("payment-qrs")
                .createSignedUrl(row.account.qrStoragePath, 3600)
            ).data?.signedUrl ?? null)
          : null,
      receiptUrl: row.expense.receiptStoragePath
        ? ((
            await supabase.storage
              .from("booking-screenshots")
              .createSignedUrl(row.expense.receiptStoragePath, 3600)
          ).data?.signedUrl ?? null)
        : null,
    }))
  );
  const items = allItems.filter(({ expense }) => isActiveCollection(expense));
  return (
    <main
      id="main-content"
      className="public-session-page min-h-screen bg-surface"
      style={sessionAccentStyle(data.session.accentColor)}
    >
      <div className="public-session-content mx-auto w-full max-w-6xl bg-surface px-4 pb-8 pt-4 sm:px-6 sm:py-8">
        <h1 className="sr-only">Your payment</h1>
        {cancelled ? (
          <p
            role="status"
            className="mt-5 border-y border-line bg-surface-raised px-4 py-3 text-sm text-muted"
          >
            This game was cancelled. Payment records remain visible, but new
            proof cannot be submitted.
          </p>
        ) : null}
        {items.length ? (
          <div className={cancelled ? "mt-5 space-y-10" : "space-y-10"}>
            {items.map(({ expense, account, payment, qrUrl, receiptUrl }) =>
              payment ? (
                <section
                  key={payment.id}
                  className="public-session-section grid min-w-0 gap-6 border-y border-line lg:grid-cols-[minmax(0,1fr)_minmax(0,20rem)] lg:gap-8"
                >
                  <header className="min-w-0 border-b border-line pb-5 lg:col-span-2">
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
                  </header>
                  <div className="min-w-0">
                    <h3 className="text-sm font-semibold">Your payment</h3>
                    <p className="score mt-2 text-xl font-semibold">
                      {peso(payment.amountCents)}
                    </p>
                    <PaymentAdjustmentDetails
                      payment={payment}
                      canRespond={!cancelled}
                    />
                    <div className="mt-5">
                      {payment.status === "confirmed" ? (
                        <p className="inline-flex items-center gap-2 text-sm font-semibold text-success">
                          <CheckCircle aria-hidden size={18} />
                          Payment confirmed
                        </p>
                      ) : payment.status === "sent" ? (
                        <p className="inline-flex items-center gap-2 text-sm font-semibold text-warning">
                          <CircleDashed aria-hidden size={18} />
                          Proof sent—waiting for host
                        </p>
                      ) : payment.status === "excluded" ? (
                        <p className="text-sm font-semibold text-muted">
                          You are not included in this split.
                        </p>
                      ) : payment.pendingAdjustment ? (
                        <p className="text-sm text-muted">
                          Respond to the proposed change before sending payment
                          proof.
                        </p>
                      ) : payment.amountCents === 0 ? (
                        <p className="text-sm font-semibold text-muted">
                          No payment is due for this share.
                        </p>
                      ) : cancelled ? (
                        <p className="text-sm text-muted">
                          Proof submission is closed.
                        </p>
                      ) : (
                        <PaymentProofForm
                          paymentId={payment.id}
                          reviewNote={payment.reviewNote}
                          slug={slug}
                        />
                      )}
                    </div>
                  </div>
                  <div className="min-w-0 space-y-6 border-t border-line pt-5 lg:border-l lg:border-t-0 lg:pl-8 lg:pt-0">
                    <PaymentBreakdown expense={expense} />
                    <PaymentCollectionProgress
                      expenseTotalCents={expense.totalCents}
                      payments={rows.flatMap((row) =>
                        row.expense.id === expense.id &&
                        row.payment &&
                        row.playerUserId !== data.session.hostId
                          ? [row.payment]
                          : []
                      )}
                    />
                    {payment.amountCents > 0 &&
                    payment.status !== "excluded" &&
                    !payment.pendingAdjustment ? (
                      <section className="border-t border-line pt-5">
                        <h3 className="font-semibold">Payment details</h3>
                        <p className="mt-2 text-sm font-medium">
                          {account?.method ?? "Payment method"}
                        </p>
                        <p className="mt-1 whitespace-pre-wrap break-words text-sm leading-5 text-muted">
                          {account?.details ??
                            "Ask the host for payment details."}
                        </p>
                        <p className="mt-3 text-xs leading-5 text-muted">
                          Pay the host, then upload proof.
                        </p>
                        {receiptUrl ? (
                          <a
                            href={receiptUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="mt-3 inline-flex min-h-9 items-center text-sm font-semibold text-primary"
                          >
                            View host receipt
                          </a>
                        ) : null}
                      </section>
                    ) : null}
                    {qrUrl &&
                    payment.amountCents > 0 &&
                    payment.status !== "excluded" &&
                    !payment.pendingAdjustment ? (
                      <div>
                        <Image
                          src={qrUrl}
                          alt={`${account?.method ?? "Payment"} QR`}
                          width={220}
                          height={220}
                          className="aspect-square w-full max-w-60 rounded-lg bg-white object-contain"
                        />
                        <p className="mt-2 max-w-60 text-center text-xs text-muted">
                          Scan to pay
                        </p>
                      </div>
                    ) : null}
                  </div>
                </section>
              ) : null
            )}
          </div>
        ) : (
          <section className="border-y border-line py-4 text-center sm:py-12">
            <CircleDashed
              aria-hidden
              className="mx-auto text-primary"
              size={24}
            />
            <h2 className="mt-4 text-xl font-bold">
              {rows.length
                ? "No share assigned to you"
                : data.session.playerPriceCents === 0
                  ? "Free game"
                  : "Payment not set up yet"}
            </h2>
            <p className="mt-2 text-sm text-muted">
              {rows.length
                ? viewer?.player.userId === data.session.hostId
                  ? "The host paid upfront and does not owe a player share."
                  : data.session.playerPriceCents == null
                    ? "Player share will be calculated when players join. Payment collection is set up."
                    : "You have no assigned share in the current collection. Ask the host if you need to be included."
                : data.session.playerPriceCents === 0
                  ? "The host marked this game Free. No payment is needed."
                  : "The host hasn’t added a repayment amount or payment method yet."}
            </p>
          </section>
        )}
        <PaymentHistory
          collections={[
            ...new Map(
              allItems
                .filter(({ expense }) => !isActiveCollection(expense))
                .map(({ expense, receiptUrl }) => [
                  expense.id,
                  { expense, receiptUrl },
                ])
            ).values(),
          ]}
          payments={allItems.flatMap(({ payment, proofUrl }) =>
            payment ? [{ payment, proofUrl }] : []
          )}
        />
      </div>
    </main>
  );
}

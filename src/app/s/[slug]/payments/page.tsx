import { CheckCircle, CircleDashed, CurrencyCircleDollar } from "@phosphor-icons/react/dist/ssr";
import { eq } from "drizzle-orm";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";

import { db } from "@/db/client";
import { expenses, paymentAccounts, playerPayments } from "@/db/schema";
import { PaymentProofForm } from "@/features/payments/payment-proof-form";
import { sessionAccentStyle } from "@/features/sessions/accent";
import { peso } from "@/features/sessions/format";
import { getPublicSession } from "@/features/sessions/queries";
import { canParticipate, getSessionViewer } from "@/features/sessions/viewer";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export default async function PublicPaymentsPage({ params }: { params: Promise<{ slug: string }> }) {
  const slug = (await params).slug;
  const data = await getPublicSession(slug);
  if (!data) notFound();
  const viewer = await getSessionViewer(data.session.id, slug);
  const canView = Boolean(viewer && canParticipate(viewer.player.rsvp));
  if (!canView)
    return (
      <main
        id="main-content"
        className="public-session-page min-h-screen bg-surface"
        style={sessionAccentStyle(data.session.accentColor)}
      >
        <div className="public-session-panel public-session-content mx-auto max-w-xl bg-surface px-4 py-14 text-center sm:mt-8 sm:rounded-xl sm:border sm:border-line sm:px-8">
          <CurrencyCircleDollar aria-hidden size={26} className="mx-auto text-primary" />
          <h1 className="mt-4 text-2xl font-bold">Payments are for players</h1>
          <p className="mt-2 leading-7 text-muted">
            Join the game first to see the host’s payment details and your assigned share.
          </p>
          <Link href={`/s/${slug}`} className="mt-6 inline-flex min-h-11 items-center font-semibold text-primary">
            Join on the plan
          </Link>
        </div>
      </main>
    );

  const rows = await db
    .select({ expense: expenses, account: paymentAccounts, payment: playerPayments })
    .from(expenses)
    .leftJoin(paymentAccounts, eq(expenses.paymentAccountId, paymentAccounts.id))
    .leftJoin(playerPayments, eq(playerPayments.expenseId, expenses.id))
    .where(eq(expenses.sessionId, data.session.id));
  const ownRows = rows.filter(({ payment }) => payment?.sessionPlayerId === viewer!.player.id);
  const supabase = createSupabaseAdminClient();
  const items = await Promise.all(
    ownRows.map(async (row) => ({
      ...row,
      qrUrl: row.account?.qrStoragePath
        ? ((await supabase.storage.from("payment-qrs").createSignedUrl(row.account.qrStoragePath, 3600)).data
            ?.signedUrl ?? null)
        : null,
      receiptUrl: row.expense.receiptStoragePath
        ? ((await supabase.storage.from("booking-screenshots").createSignedUrl(row.expense.receiptStoragePath, 3600))
            .data?.signedUrl ?? null)
        : null,
    })),
  );
  return (
    <main
      id="main-content"
      className="public-session-page min-h-screen bg-surface"
      style={sessionAccentStyle(data.session.accentColor)}
    >
      <div className="public-session-panel public-session-content mx-auto max-w-6xl bg-surface px-4 py-8 sm:mt-8 sm:rounded-xl sm:border sm:border-line sm:px-8">
        <p className="text-sm font-semibold text-primary">{data.session.title}</p>
        <h1 className="mt-1 app-title">Your payment</h1>
        <p className="mt-2 max-w-xl text-sm leading-6 text-muted">
          The host paid upfront. Repay your share through their listed app or bank, then upload one screenshot. Relay
          never moves the money.
        </p>
        {items.length ? (
          <div className="mt-8 space-y-10">
            {items.map(({ expense, account, payment, qrUrl, receiptUrl }) =>
              payment ? (
                <section
                  key={payment.id}
                  className="public-session-section grid min-w-0 gap-6 border-y border-line sm:grid-cols-[minmax(0,1fr)_220px]"
                >
                  <div className="min-w-0">
                    <p className="text-sm capitalize text-muted">{expense.kind.replaceAll("_", " ")}</p>
                    <p className="score mt-1 text-3xl font-bold">{peso(payment.amountCents)}</p>
                    <p className="mt-1 text-sm text-muted">Your share of the {peso(expense.totalCents)} total</p>
                    <div className="mt-5 border-t border-line pt-4">
                      <p className="text-sm font-semibold">{account?.method ?? "Payment method"}</p>
                      <p className="mt-1 whitespace-pre-wrap text-sm leading-6 text-muted">
                        {account?.details ?? "Ask the host for payment details."}
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
                    </div>
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
                        <p className="text-sm font-semibold text-muted">You are not included in this split.</p>
                      ) : (
                        <PaymentProofForm paymentId={payment.id} reviewNote={payment.reviewNote} slug={slug} />
                      )}
                    </div>
                  </div>
                  {qrUrl ? (
                    <div>
                      <Image
                        src={qrUrl}
                        alt={`${account?.method ?? "Payment"} QR`}
                        width={220}
                        height={220}
                        className="aspect-square w-full rounded-lg bg-white object-contain"
                      />
                      <p className="mt-2 text-center text-xs text-muted">Scan to pay</p>
                    </div>
                  ) : null}
                </section>
              ) : null,
            )}
          </div>
        ) : (
          <section className="mt-10 border-y border-line py-12 text-center">
            <CircleDashed aria-hidden className="mx-auto text-primary" size={24} />
            <h2 className="mt-4 text-xl font-bold">No payment request yet</h2>
            <p className="mt-2 text-sm text-muted">
              The host hasn’t created the split. Check again after the roster is settled.
            </p>
          </section>
        )}
      </div>
    </main>
  );
}

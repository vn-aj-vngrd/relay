import Image from "next/image";

import { Alert } from "@/components/ui/alert";
import type { BillingMethodSnapshot } from "@/db/schema";

import { billingDate, plans, storageLabel } from "./domain";
import { PaymentDetailsCopy } from "./payment-details-copy";
import type { getAccountUsage } from "./usage";

export { requestStatusLabels } from "./domain";

export function PlanUsage({
  usage,
}: {
  usage: Awaited<ReturnType<typeof getAccountUsage>>;
}) {
  return (
    <section aria-labelledby="plan-usage-title">
      <h2 id="plan-usage-title" className="text-lg font-semibold">
        {plans[usage.plan].name} plan
      </h2>
      <dl className="mt-4 divide-y divide-line border-y border-line text-sm">
        <div className="flex flex-wrap justify-between gap-2 py-4">
          <dt>
            Games created{usage.gamesOverridden ? " · Admin override" : ""}
          </dt>
          <dd className="score">
            {usage.gamesUsed} / {usage.games}
          </dd>
        </div>
        <div className="flex flex-wrap justify-between gap-2 py-4">
          <dt>
            Hosted-game media
            {usage.storageOverridden ? " · Admin override" : ""}
          </dt>
          <dd className="score">
            {storageLabel(usage.bytesUsed)} / {storageLabel(usage.storageBytes)}
          </dd>
        </div>
        <div className="flex flex-wrap justify-between gap-2 py-4">
          <dt>
            {usage.plan === "pro"
              ? "Current Pro period ends"
              : "Game allowance resets"}
          </dt>
          <dd>{billingDate(usage.end)} (PH)</dd>
        </div>
        {usage.paidThrough ? (
          <div className="flex flex-wrap justify-between gap-2 py-4">
            <dt>Pro access {usage.plan === "pro" ? "through" : "ended"}</dt>
            <dd>{billingDate(usage.paidThrough)} (PH)</dd>
          </div>
        ) : null}
        {usage.term ? (
          <div className="flex flex-wrap justify-between gap-2 py-4">
            <dt>Access source</dt>
            <dd>
              {usage.term.source === "manual"
                ? "Manually verified payment"
                : "Complimentary grant"}
            </dd>
          </div>
        ) : null}
      </dl>
      <p className="mt-3 max-w-2xl text-sm leading-6 text-muted">
        Storage includes chat images and game photos added by anyone in games
        you host. It does not reset monthly. Failed game creation does not spend
        your allowance; deleting a game does not refund it.
      </p>
      {usage.plan === "pro" &&
      usage.paidThrough &&
      usage.paidThrough.getTime() - Date.now() <= 7 * 86400_000 ? (
        <Alert variant="info" className="mt-4">
          Pro ends {billingDate(usage.paidThrough)} (PH). Renew manually to keep
          your allowance. No automatic charge will be made.
        </Alert>
      ) : null}
    </section>
  );
}

export function PlanComparison() {
  return (
    <section aria-labelledby="plan-comparison-title">
      <h2 id="plan-comparison-title" className="text-lg font-semibold">
        Personal plans
      </h2>
      <div className="mt-4 overflow-x-auto">
        <table className="w-full text-left text-sm">
          <caption className="sr-only">
            Free and Pro personal subscriptions
          </caption>
          <thead>
            <tr className="border-b border-line">
              <th scope="col" className="py-3 pr-4">
                Allowance
              </th>
              <th scope="col" className="py-3 pr-4">
                Free
              </th>
              <th scope="col" className="py-3">
                Pro
              </th>
            </tr>
          </thead>
          <tbody>
            {[
              [
                "Price",
                `₱${plans.free.priceCents / 100}`,
                `₱${plans.pro.priceCents / 100}/month`,
              ],
              [
                "Successful game creations",
                `${plans.free.games}/month`,
                `${plans.pro.games}/month`,
              ],
              [
                "Chat-image + memory storage",
                `${storageLabel(plans.free.storageBytes)} total`,
                `${storageLabel(plans.pro.storageBytes)} total`,
              ],
              ["Players / courts per game", "40 / 20", "40 / 20"],
            ].map(([label, free, pro]) => (
              <tr key={label} className="border-b border-line">
                <th scope="row" className="py-4 pr-4 font-medium">
                  {label}
                </th>
                <td className="py-4 pr-4">{free}</td>
                <td className="py-4">{pro}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="mt-3 max-w-2xl text-sm leading-6 text-muted">
        Both plans include guest RSVP, joining games, co-hosting, groups, Play,
        scoring, basic recap, text chat and repayments. Players do not need Pro
        to join a Pro host’s game. Normal abuse protection applies.
      </p>
    </section>
  );
}

export function PaymentInstructions({
  snapshot,
  qrUrl,
  downloadUrl,
}: {
  snapshot: BillingMethodSnapshot;
  qrUrl: string | null;
  downloadUrl: string | null;
}) {
  return (
    <div className="grid gap-6 sm:grid-cols-[minmax(0,1fr)_auto]">
      <div className="min-w-0">
        <dl className="flex flex-col gap-3 text-sm">
          <div>
            <dt className="text-muted">Payment method</dt>
            <dd className="mt-1 font-semibold">{snapshot.provider}</dd>
          </div>
          <div>
            <dt className="text-muted">Recipient</dt>
            <dd className="mt-1 break-words font-semibold">
              {snapshot.recipient}
            </dd>
          </div>
          <div>
            <dt className="text-muted">Account number / mobile number</dt>
            <dd className="mt-1 break-all font-semibold">{snapshot.account}</dd>
          </div>
        </dl>
        <p className="mt-4 whitespace-pre-wrap text-sm leading-6">
          {snapshot.instructions}
        </p>
        <PaymentDetailsCopy
          details={`${snapshot.provider}\n${snapshot.recipient}\n${snapshot.account}`}
        />
      </div>
      {snapshot.qrPath && !qrUrl ? (
        <Alert variant="info">
          The payment QR could not be loaded. Refresh this page or verify the
          account details with billing support before paying.
        </Alert>
      ) : null}
      {qrUrl ? (
        <div className="flex flex-col items-start gap-3">
          <Image
            unoptimized
            src={qrUrl}
            alt={`Payment QR for ${snapshot.recipient} via ${snapshot.provider}`}
            width={240}
            height={240}
            className="size-60 max-w-full rounded-lg border border-line object-contain"
          />
          {downloadUrl ? (
            <a
              href={downloadUrl}
              className="inline-flex min-h-9 items-center text-sm font-semibold text-primary"
            >
              Download QR
            </a>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

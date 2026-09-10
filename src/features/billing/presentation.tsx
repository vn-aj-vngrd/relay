import Image from "next/image";

import { Alert } from "@/components/ui/alert";
import type { BillingMethodSnapshot } from "@/db/schema";

import { billingDate, plans, storageLabel } from "./domain";
import { PaymentDetailsCopy } from "./payment-details-copy";
import type { getAccountUsage } from "./usage";

export { requestStatusLabels } from "./domain";

export function PlanUsage({
  usage,
  compact = false,
}: {
  usage: Awaited<ReturnType<typeof getAccountUsage>>;
  compact?: boolean;
}) {
  return (
    <section aria-labelledby="plan-usage-title">
      <h2 id="plan-usage-title" className="text-lg font-semibold">
        {plans[usage.plan].name} plan
      </h2>
      <dl className="mt-4 divide-y divide-line border-y border-line text-sm">
        {usage.planAssigned ? (
          <div className="flex flex-wrap justify-between gap-2 py-4">
            <dt>Admin-assigned plan</dt>
            <dd>
              {usage.planAssignmentExpiresAt
                ? `Until ${billingDate(usage.planAssignmentExpiresAt)} (PH)`
                : "Until an admin removes it"}
            </dd>
          </div>
        ) : null}
        <div className="flex flex-wrap justify-between gap-2 py-4">
          <dt>
            {usage.planAssigned
              ? "Games created in this usage period"
              : usage.plan === "free"
                ? "Games created this calendar month"
                : "Games created this term"}
            {usage.gamesOverridden ? " · Admin override" : ""}
          </dt>
          <dd className="score">
            {usage.gamesUsed} /{" "}
            {usage.gamesUnlimited ? "Unlimited" : usage.games}
          </dd>
        </div>
        <div className="flex flex-wrap justify-between gap-2 py-4">
          <dt>
            Total photo storage
            {usage.storageOverridden ? " · Admin override" : ""}
          </dt>
          <dd className="score">
            {storageLabel(usage.bytesUsed)} /{" "}
            {usage.storageUnlimited
              ? "Unlimited"
              : storageLabel(usage.storageBytes)}
          </dd>
        </div>
        <div className="flex flex-wrap justify-between gap-2 py-4">
          <dt>
            {usage.planAssigned || usage.plan !== "free"
              ? "Game usage period ends"
              : "Game allowance resets"}
          </dt>
          <dd>{billingDate(usage.end)} (PH)</dd>
        </div>
        {usage.paidThrough &&
        (!compact ||
          (!usage.planAssigned &&
            usage.plan !== "free" &&
            usage.paidThrough > usage.end)) ? (
          <div className="flex flex-wrap justify-between gap-2 py-4">
            <dt>
              {usage.planAssigned
                ? "Underlying subscription paid through"
                : usage.plan !== "free"
                  ? "Paid-plan access through"
                  : "Paid-plan access ended"}
            </dt>
            <dd>{billingDate(usage.paidThrough)} (PH)</dd>
          </div>
        ) : null}
        {usage.term && !compact ? (
          <div className="flex flex-wrap justify-between gap-2 py-4">
            <dt>
              {usage.planAssigned
                ? "Underlying subscription source"
                : "Access source"}
            </dt>
            <dd>
              {usage.term.source === "manual"
                ? "Manually verified payment"
                : "Complimentary grant"}
            </dd>
          </div>
        ) : null}
      </dl>
      <p className="mt-3 max-w-2xl text-sm leading-6 text-muted">
        {compact
          ? "Chat images and game photos share your total storage. Storage does not reset monthly."
          : "Storage includes chat images and game photos added by anyone in games you host. It does not reset monthly. Failed game creation does not spend your allowance; deleting a game does not refund it."}
        {usage.plan === "unlimited"
          ? " Upload and safety limits still apply."
          : null}
      </p>
      {!usage.planAssigned &&
      usage.plan !== "free" &&
      usage.paidThrough &&
      usage.paidThrough.getTime() - Date.now() <= 7 * 86400_000 ? (
        <Alert variant="info" className="mt-4">
          Paid-plan access ends {billingDate(usage.paidThrough)} (PH). Renew
          manually to keep your allowance. No automatic charge will be made.
        </Alert>
      ) : null}
    </section>
  );
}

export { PlanComparison } from "./plan-comparison";

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

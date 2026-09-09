import { DEFAULT_CHAT_IMAGE_MAX_BYTES } from "@/lib/upload-config";

export const MiB = 1024 * 1024;

// Immutable versions: new commercial terms require a new version, not an edit.
export const plans = {
  free: {
    version: "free-v1",
    name: "Free",
    priceCents: 0,
    games: 5,
    storageBytes: 100 * MiB,
  },
  pro: {
    version: "pro-v1",
    name: "Pro",
    priceCents: 29_900,
    games: 30,
    storageBytes: 2048 * MiB,
  },
} as const;

export const mediaPolicy = {
  chat: {
    maxBytes: DEFAULT_CHAT_IMAGE_MAX_BYTES,
    dailyUploads: 10,
    bucket: "chat-images",
  },
  memory: { maxBytes: 2 * MiB, dailyUploads: 20, bucket: "session-memories" },
} as const;

export const billingProviders = [
  "GCash",
  "Maya",
  "Bank transfer",
  "Other",
] as const;

export const requestStatusLabels = {
  awaiting_payment: "Awaiting payment",
  submitted: "Awaiting verification",
  clarification: "More information needed",
  approved: "Approved",
  rejected: "Rejected",
  cancelled: "Cancelled",
};

export type BillingState = { error?: string; success?: string };
export class BillingError extends Error {}

const manilaOffset = 8 * 60 * 60 * 1000;
export function manilaMonth(now: Date) {
  const local = new Date(now.getTime() + manilaOffset);
  return {
    start: new Date(
      Date.UTC(local.getUTCFullYear(), local.getUTCMonth(), 1) - manilaOffset
    ),
    end: new Date(
      Date.UTC(local.getUTCFullYear(), local.getUTCMonth() + 1, 1) -
        manilaOffset
    ),
  };
}

export function manilaDay(now: Date) {
  const local = new Date(now.getTime() + manilaOffset);
  return new Date(
    Date.UTC(local.getUTCFullYear(), local.getUTCMonth(), local.getUTCDate()) -
      manilaOffset
  );
}

// Clamp January 31 -> February 28/29, retaining Philippine local time.
export function nextBillingMonth(start: Date) {
  const local = new Date(start.getTime() + manilaOffset);
  const year = local.getUTCFullYear();
  const month = local.getUTCMonth() + 1;
  const day = Math.min(
    local.getUTCDate(),
    new Date(Date.UTC(year, month + 1, 0)).getUTCDate()
  );
  return new Date(
    Date.UTC(
      year,
      month,
      day,
      local.getUTCHours(),
      local.getUTCMinutes(),
      local.getUTCSeconds(),
      local.getUTCMilliseconds()
    ) - manilaOffset
  );
}

export function renewalPeriod(now: Date, paidThrough?: Date | null) {
  const start = paidThrough && paidThrough > now ? paidThrough : now;
  return { start, end: nextBillingMonth(start) };
}

export function billingDate(date: Date | string) {
  return new Intl.DateTimeFormat("en-PH", {
    timeZone: "Asia/Manila",
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(date));
}

export function storageLabel(bytes: number) {
  return bytes >= 1024 * MiB
    ? `${(bytes / (1024 * MiB)).toFixed(1)} GiB`
    : `${(bytes / MiB).toFixed(1)} MiB`;
}

export function transactionKey(provider: string, reference: string) {
  return `${provider.trim().toLowerCase()}:${reference
    .trim()
    .toUpperCase()
    .replace(/[\s-]+/g, "")}`;
}

export function resolveAllowance(input: {
  now: Date;
  term?: {
    startsAt: Date;
    endsAt: Date;
    games: number;
    storageBytes: number;
    usageStartsAt: Date;
  } | null;
  override?: {
    games: number | null;
    storageBytes: number | null;
    expiresAt: Date | null;
  } | null;
}) {
  const { now, term, override } = input;
  const activeTerm =
    term && term.startsAt <= now && term.endsAt > now ? term : null;
  const activeOverride =
    override && (!override.expiresAt || override.expiresAt > now)
      ? override
      : null;
  const month = manilaMonth(now);
  return {
    plan: activeTerm ? ("pro" as const) : ("free" as const),
    games: activeOverride?.games ?? activeTerm?.games ?? plans.free.games,
    storageBytes:
      activeOverride?.storageBytes ??
      activeTerm?.storageBytes ??
      plans.free.storageBytes,
    gamesOverridden: activeOverride?.games != null,
    storageOverridden: activeOverride?.storageBytes != null,
    start: activeTerm?.usageStartsAt ?? month.start,
    end: activeTerm?.endsAt ?? month.end,
  };
}

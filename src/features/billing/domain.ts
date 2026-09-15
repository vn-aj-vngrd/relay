import {
  DEFAULT_CHAT_IMAGE_MAX_BYTES,
  DEFAULT_MEMORY_IMAGE_MAX_BYTES,
} from "@/lib/upload-config";

export const MiB = 1024 * 1024;

// Immutable versions: new commercial terms require a new version, not an edit.
export const plans = {
  unlimited: {
    version: "unlimited-v1",
    name: "Unlimited",
    priceCents: 0,
    games: 0,
    storageBytes: 0,
  },
  free: {
    version: "free-v2",
    name: "Free",
    priceCents: 0,
    games: 12,
    storageBytes: 250 * MiB,
  },
  plus: {
    version: "plus-v2",
    name: "Plus",
    priceCents: 14_900,
    games: 40,
    storageBytes: 2048 * MiB,
  },
  pro: {
    version: "pro-v2",
    name: "Pro",
    priceCents: 29_900,
    games: 100,
    storageBytes: 10 * 1024 * MiB,
  },
} as const;

export type PlanId = keyof typeof plans;
export type PlanAvailability = "coming_soon" | "active" | "paused";
export type BillingPlan = {
  id: PlanId;
  version: string;
  name: string;
  priceCents: number;
  games: number;
  storageBytes: number;
  availability: PlanAvailability;
  visible: boolean;
};
export const defaultBillingPlans: BillingPlan[] = (
  ["free", "plus", "pro", "unlimited"] as const
).map((id) => ({
  id,
  ...plans[id],
  availability: id === "free" || id === "unlimited" ? "active" : "coming_soon",
  visible: id !== "unlimited",
}));

// Merge by identity so existing three-tier JSON catalogs gain new defaults.
export function normalizeBillingCatalog(
  catalog?: BillingPlan[] | null
): BillingPlan[] {
  return defaultBillingPlans.map((fallback) => {
    const stored = catalog?.find((plan) => plan.id === fallback.id);
    // Upgrade only unchanged standard v1 offers. Preserve custom published
    // terms, availability and account/paid snapshots.
    const legacy = {
      free: { games: 5, storageBytes: 100 * MiB },
      plus: { games: 12, storageBytes: 500 * MiB },
      pro: { games: 30, storageBytes: 2048 * MiB },
    };
    const previous = fallback.id === "unlimited" ? null : legacy[fallback.id];
    const standardLegacy =
      previous &&
      stored &&
      stored.version === `${fallback.id}-v1` &&
      stored.games === previous.games &&
      stored.storageBytes === previous.storageBytes &&
      stored.priceCents === fallback.priceCents;
    return {
      ...fallback,
      ...stored,
      ...(standardLegacy
        ? {
            version: fallback.version,
            games: fallback.games,
            storageBytes: fallback.storageBytes,
          }
        : {}),
      visible: fallback.id === "unlimited" ? false : (stored?.visible ?? true),
    };
  });
}

export function publicBillingPlans(catalog: BillingPlan[]) {
  return catalog.filter((plan) => plan.visible && plan.id !== "unlimited");
}

export function planIdFromVersion(version?: string): PlanId {
  if (version?.startsWith("unlimited-")) return "unlimited";
  return version?.startsWith("plus-") ? "plus" : "pro";
}

export const mediaPolicy = {
  chat: {
    maxBytes: DEFAULT_CHAT_IMAGE_MAX_BYTES,
    dailyUploads: 10,
    bucket: "chat-images",
  },
  memory: {
    maxBytes: DEFAULT_MEMORY_IMAGE_MAX_BYTES,
    dailyUploads: 100,
    perGame: 50,
    bucket: "session-memories",
  },
} as const;

export type GamePhotoAllowance = {
  maxImageBytes?: number;
  photosUsed: number;
  photoLimit: number;
  bytesUsed: number;
  storageBytes: number;
  storageUnlimited: boolean;
};

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
  freePlan?: { games: number; storageBytes: number };
  term?: {
    planVersion?: string;
    startsAt: Date;
    endsAt: Date;
    games: number;
    storageBytes: number;
    usageStartsAt: Date;
  } | null;
  override?: {
    planOverride?: BillingPlan | null;
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
  const assigned = activeOverride?.planOverride;
  const plan =
    assigned?.id ??
    (activeTerm
      ? planIdFromVersion(activeTerm.planVersion)
      : ("free" as const));
  return {
    plan,
    planAssigned: Boolean(assigned),
    planAssignmentExpiresAt: assigned
      ? (activeOverride?.expiresAt ?? null)
      : null,
    gamesUnlimited: plan === "unlimited" && activeOverride?.games == null,
    storageUnlimited:
      plan === "unlimited" && activeOverride?.storageBytes == null,
    games:
      activeOverride?.games ??
      assigned?.games ??
      activeTerm?.games ??
      input.freePlan?.games ??
      plans.free.games,
    storageBytes:
      activeOverride?.storageBytes ??
      assigned?.storageBytes ??
      activeTerm?.storageBytes ??
      input.freePlan?.storageBytes ??
      plans.free.storageBytes,
    gamesOverridden: activeOverride?.games != null,
    storageOverridden: activeOverride?.storageBytes != null,
    start: activeTerm?.usageStartsAt ?? month.start,
    end: activeTerm?.endsAt ?? month.end,
  };
}

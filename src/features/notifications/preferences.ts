import type { NotificationCategoryPreferences } from "@/db/schema";

export const notificationCategories = [
  "invitations",
  "roster",
  "reminders",
  "changes",
  "booking",
  "payments",
  "recap",
] as const;
export type NotificationCategory = (typeof notificationCategories)[number];
export type DeliveryChannel = "email" | "push";

export const notificationCategoryLabels: Record<
  NotificationCategory,
  { label: string; description: string }
> = {
  invitations: {
    label: "Invitations",
    description: "New invitations to games.",
  },
  roster: {
    label: "RSVP and waitlist",
    description: "Approvals, removals, and available spots.",
  },
  reminders: {
    label: "Game reminders",
    description: "Day-before and starting-soon reminders.",
  },
  changes: {
    label: "Important changes",
    description: "Time, venue, cancellation, and cost changes.",
  },
  booking: {
    label: "Booking updates",
    description: "Court booking confirmations.",
  },
  payments: {
    label: "Payments",
    description: "Payment requests, proof reviews, and confirmations.",
  },
  recap: {
    label: "Recap ready",
    description: "When a completed game is ready to revisit.",
  },
};

export const defaultCategoryPreferences: NotificationCategoryPreferences = {
  invitations: true,
  roster: true,
  reminders: true,
  changes: true,
  booking: true,
  payments: true,
  recap: true,
};

const categoriesByType: Record<string, NotificationCategory> = {
  session_invite: "invitations",
  cohost_assigned: "changes",
  cohost_removed: "changes",
  join_request: "roster",
  player_joined: "roster",
  player_left: "roster",
  join_approved: "roster",
  moved_to_waitlist: "roster",
  moved_from_waitlist: "roster",
  removed_from_session: "roster",
  session_tomorrow: "reminders",
  session_starting_soon: "reminders",
  session_details_changed: "changes",
  session_cost_changed: "changes",
  session_cancelled: "changes",
  booking_confirmed: "booking",
  payment_requested: "payments",
  payment_sent: "payments",
  payment_confirmed: "payments",
  payment_proof_requested: "payments",
  payment_updated: "payments",
  session_completed: "recap",
};

const emailCategories = new Set<NotificationCategory>([
  "invitations",
  "roster",
  "reminders",
  "changes",
  "booking",
]);
const pushCategories = new Set<NotificationCategory>(notificationCategories);

const emailTypes = new Set([
  "session_invite",
  "cohost_assigned",
  "cohost_removed",
  "moved_from_waitlist",
  "session_tomorrow",
  "session_details_changed",
  "session_cost_changed",
  "session_cancelled",
  "booking_confirmed",
]);
const pushTypes = new Set([
  ...emailTypes,
  "session_starting_soon",
  "join_approved",
  "removed_from_session",
  "payment_requested",
  "payment_confirmed",
  "session_completed",
]);

export function channelSupportsCategory(
  channel: DeliveryChannel,
  category: NotificationCategory
) {
  return (channel === "email" ? emailCategories : pushCategories).has(category);
}

export function notificationCategory(type: string) {
  return categoriesByType[type] ?? null;
}

export function channelAllowsNotification(
  channel: DeliveryChannel,
  type: string
) {
  return (channel === "email" ? emailTypes : pushTypes).has(type);
}

export function categoryEnabled(
  preferences: NotificationCategoryPreferences,
  category: NotificationCategory
) {
  return preferences[category] !== false;
}

export function reminderTimingEnabled(
  type: string,
  dayBefore: boolean,
  hourBefore: boolean
) {
  if (type === "session_tomorrow") return dayBefore;
  if (type === "session_starting_soon") return hourBefore;
  return true;
}

export function isWithinQuietHours(
  now: Date,
  timeZone: string,
  start: string | null,
  end: string | null
) {
  if (!start || !end || start === end) return false;
  let localMinutes: number;
  try {
    const parts = new Intl.DateTimeFormat("en-GB", {
      timeZone,
      hour: "2-digit",
      minute: "2-digit",
      hourCycle: "h23",
    }).formatToParts(now);
    localMinutes =
      Number(parts.find(({ type }) => type === "hour")?.value) * 60 +
      Number(parts.find(({ type }) => type === "minute")?.value);
  } catch {
    return false;
  }
  const minutes = (value: string) => {
    const [hour, minute] = value.split(":").map(Number);
    return hour * 60 + minute;
  };
  const startMinutes = minutes(start);
  const endMinutes = minutes(end);
  return startMinutes < endMinutes
    ? localMinutes >= startMinutes && localMinutes < endMinutes
    : localMinutes >= startMinutes || localMinutes < endMinutes;
}

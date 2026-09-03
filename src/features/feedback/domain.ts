export const feedbackTypes = ["bug", "feature", "general"] as const;
export type FeedbackType = (typeof feedbackTypes)[number];

export const feedbackStatuses = [
  "new",
  "reviewing",
  "planned",
  "resolved",
  "closed",
] as const;
export type FeedbackStatus = (typeof feedbackStatuses)[number];

export const feedbackAreas = [
  "general",
  "create",
  "invite",
  "players",
  "play",
  "chat",
  "payments",
  "groups",
  "notifications",
  "account",
] as const;
export type FeedbackArea = (typeof feedbackAreas)[number];

export const feedbackTypeLabels: Record<FeedbackType, string> = {
  bug: "Bug report",
  feature: "Feature request",
  general: "General feedback",
};

export const feedbackStatusLabels: Record<FeedbackStatus, string> = {
  new: "New",
  reviewing: "Reviewing",
  planned: "Planned",
  resolved: "Resolved",
  closed: "Closed",
};

export const feedbackAreaLabels: Record<FeedbackArea, string> = {
  general: "Relay overall",
  create: "Creating a game",
  invite: "Shared link and RSVP",
  players: "Players and waitlist",
  play: "Play, courts, and scoring",
  chat: "Session chat",
  payments: "Payments",
  groups: "Groups",
  notifications: "Notifications",
  account: "Profile and account",
};

export function isOpenFeedbackStatus(status: FeedbackStatus) {
  return status === "new" || status === "reviewing" || status === "planned";
}

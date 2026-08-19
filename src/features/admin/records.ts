export const ADMIN_PAGE_SIZE = 30;
export const adminResources = ["users", "sessions", "venues", "feedback", "audit"] as const;
export type AdminResource = (typeof adminResources)[number];
export type AdminDateValue = Date | string;

export type AdminUserRecord = {
  id: string;
  email: string;
  createdAt: AdminDateValue;
  suspendedAt: AdminDateValue | null;
  name: string | null;
  username: string | null;
  sessionsHosted: number;
};

export type AdminSessionRecord = {
  id: string;
  title: string;
  venueName: string;
  startsAt: AdminDateValue;
  status: string;
  capacity: number;
  hostEmail: string;
  hostName: string | null;
  playerCount: number;
};

export type AdminVenueRecord = {
  id: string;
  name: string;
  address: string;
  source: string;
  listingStatus: string;
  courtCount: number | null;
  updatedAt: AdminDateValue;
};

export type AdminFeedbackRecord = {
  id: string;
  type: string;
  area: string;
  status: string;
  title: string;
  createdAt: AdminDateValue;
  submitterEmail: string;
  submitterName: string | null;
};

export type AdminAuditRecord = {
  id: string;
  action: string;
  targetType: string;
  targetId: string;
  reason: string | null;
  createdAt: AdminDateValue;
  actorEmail: string;
  actorName: string | null;
};

export type AdminRecord =
  AdminUserRecord | AdminSessionRecord | AdminVenueRecord | AdminFeedbackRecord | AdminAuditRecord;

export type AdminRecordMap = {
  users: AdminUserRecord;
  sessions: AdminSessionRecord;
  venues: AdminVenueRecord;
  feedback: AdminFeedbackRecord;
  audit: AdminAuditRecord;
};

export type AdminPage<T> = {
  items: T[];
  nextCursor: string | null;
};

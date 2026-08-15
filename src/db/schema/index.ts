import {
  boolean,
  check,
  index,
  integer,
  jsonb,
  numeric,
  pgEnum,
  pgTable,
  primaryKey,
  text,
  timestamp,
  unique,
  uuid,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

const timestamps = {
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
};

export const sessionStatus = pgEnum("session_status", ["draft", "published", "live", "completed", "cancelled"]);
export const visibility = pgEnum("visibility", ["public", "link", "private"]);
export const rsvpStatus = pgEnum("rsvp_status", ["invited", "going", "maybe", "waitlisted", "declined"]);
export const playerState = pgEnum("player_state", ["available", "playing", "waiting", "resting", "unavailable"]);
export const memberRole = pgEnum("member_role", ["owner", "admin", "member"]);
export const sessionRole = pgEnum("session_role", ["host", "cohost", "player"]);
export const matchStatus = pgEnum("match_status", ["scheduled", "active", "completed", "cancelled"]);
export const paymentStatus = pgEnum("payment_status", ["unpaid", "sent", "confirmed", "excluded"]);
export const expenseKind = pgEnum("expense_kind", ["court", "ball", "paddle_rental", "drinks", "other"]);
export const rotationMode = pgEnum("rotation_mode", ["manual", "queue", "random", "winner_stays", "king_of_court"]);

export const users = pgTable("users", {
  id: uuid("id").primaryKey(), // Mirrors auth.users; deletion is handled by an anonymization job.
  email: text("email").notNull().unique(),
  deletedAt: timestamp("deleted_at", { withTimezone: true }),
  ...timestamps,
});

export const profiles = pgTable("profiles", {
  userId: uuid("user_id").primaryKey().references(() => users.id, { onDelete: "cascade" }),
  username: text("username").notNull().unique(),
  name: text("name").notNull(),
  avatarPath: text("avatar_path"),
  bio: text("bio"),
  skillLevel: text("skill_level"),
  dominantHand: text("dominant_hand"),
  city: text("city"),
  ...timestamps,
});

export const venues = pgTable("venues", {
  id: uuid("id").defaultRandom().primaryKey(),
  slug: text("slug").notNull().unique(),
  name: text("name").notNull(),
  address: text("address").notNull(),
  latitude: numeric("latitude", { precision: 9, scale: 6 }),
  longitude: numeric("longitude", { precision: 9, scale: 6 }),
  environment: text("environment"),
  courtCount: integer("court_count"),
  hours: jsonb("hours").$type<Record<string, string>>(),
  priceRange: text("price_range"),
  parking: text("parking"),
  amenities: text("amenities").array(),
  paddleRental: boolean("paddle_rental").notNull().default(false),
  contact: text("contact"),
  websiteUrl: text("website_url"),
  socialUrl: text("social_url"),
  bookingUrl: text("booking_url"),
  ...timestamps,
});

export const venuePhotos = pgTable("venue_photos", {
  id: uuid("id").defaultRandom().primaryKey(),
  venueId: uuid("venue_id").notNull().references(() => venues.id, { onDelete: "cascade" }),
  storagePath: text("storage_path").notNull(),
  altText: text("alt_text").notNull(),
  sortOrder: integer("sort_order").notNull().default(0),
  ...timestamps,
});

export const groups = pgTable("groups", {
  id: uuid("id").defaultRandom().primaryKey(),
  slug: text("slug").notNull().unique(),
  ownerId: uuid("owner_id").notNull().references(() => users.id, { onDelete: "restrict" }),
  name: text("name").notNull(),
  description: text("description"),
  imagePath: text("image_path"),
  ...timestamps,
});

export const groupMembers = pgTable("group_members", {
  groupId: uuid("group_id").notNull().references(() => groups.id, { onDelete: "cascade" }),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "restrict" }),
  role: memberRole("role").notNull().default("member"),
  joinedAt: timestamp("joined_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [primaryKey({ columns: [table.groupId, table.userId] })]);

export const sessions = pgTable("sessions", {
  id: uuid("id").defaultRandom().primaryKey(),
  slug: text("slug").notNull().unique(),
  hostId: uuid("host_id").notNull().references(() => users.id, { onDelete: "restrict" }),
  groupId: uuid("group_id").references(() => groups.id, { onDelete: "set null" }),
  venueId: uuid("venue_id").references(() => venues.id, { onDelete: "set null" }),
  venueName: text("venue_name").notNull(),
  venueAddress: text("venue_address"),
  title: text("title").notNull(),
  startsAt: timestamp("starts_at", { withTimezone: true }).notNull(),
  endsAt: timestamp("ends_at", { withTimezone: true }).notNull(),
  timezone: text("timezone").notNull().default("Asia/Manila"),
  capacity: integer("capacity").notNull(),
  courtCount: integer("court_count").notNull().default(1),
  courtNumbers: text("court_numbers").array(),
  notes: text("notes"),
  estimatedCostCents: integer("estimated_cost_cents"),
  status: sessionStatus("status").notNull().default("draft"),
  visibility: visibility("visibility").notNull().default("link"),
  rotationMode: rotationMode("rotation_mode").notNull().default("queue"),
  rotationConfig: jsonb("rotation_config").$type<Record<string, unknown>>().notNull().default({}),
  rosterLocked: boolean("roster_locked").notNull().default(false),
  bookedAt: timestamp("booked_at", { withTimezone: true }),
  bookingReference: text("booking_reference"),
  bookingScreenshotPath: text("booking_screenshot_path"),
  bookingTotalCents: integer("booking_total_cents"),
  bookingNotes: text("booking_notes"),
  version: integer("version").notNull().default(1),
  publishedAt: timestamp("published_at", { withTimezone: true }),
  completedAt: timestamp("completed_at", { withTimezone: true }),
  ...timestamps,
}, (table) => [
  check("session_capacity_positive", sql`${table.capacity} >= 2`),
  check("session_courts_positive", sql`${table.courtCount} >= 1`),
  check("session_time_valid", sql`${table.endsAt} > ${table.startsAt}`),
  index("sessions_starts_at_idx").on(table.startsAt),
]);

export const sessionPlayers = pgTable("session_players", {
  id: uuid("id").defaultRandom().primaryKey(),
  sessionId: uuid("session_id").notNull().references(() => sessions.id, { onDelete: "restrict" }),
  userId: uuid("user_id").references(() => users.id, { onDelete: "restrict" }),
  guestName: text("guest_name"),
  guestTokenHash: text("guest_token_hash"),
  role: sessionRole("role").notNull().default("player"),
  rsvp: rsvpStatus("rsvp").notNull().default("invited"),
  playState: playerState("play_state").notNull().default("unavailable"),
  waitlistPosition: integer("waitlist_position"),
  invitedAt: timestamp("invited_at", { withTimezone: true }).notNull().defaultNow(),
  respondedAt: timestamp("responded_at", { withTimezone: true }),
  leftAt: timestamp("left_at", { withTimezone: true }),
  ...timestamps,
}, (table) => [
  unique("session_user_unique").on(table.sessionId, table.userId),
  check("player_identity_present", sql`${table.userId} is not null or ${table.guestName} is not null`),
  index("session_players_roster_idx").on(table.sessionId, table.rsvp),
]);

export const sessionInvites = pgTable("session_invites", {
  id: uuid("id").defaultRandom().primaryKey(),
  sessionId: uuid("session_id").notNull().references(() => sessions.id, { onDelete: "cascade" }),
  invitedById: uuid("invited_by_id").notNull().references(() => users.id, { onDelete: "restrict" }),
  email: text("email"),
  tokenHash: text("token_hash").notNull().unique(),
  expiresAt: timestamp("expires_at", { withTimezone: true }),
  acceptedAt: timestamp("accepted_at", { withTimezone: true }),
  ...timestamps,
});

export const courts = pgTable("courts", {
  id: uuid("id").defaultRandom().primaryKey(),
  sessionId: uuid("session_id").notNull().references(() => sessions.id, { onDelete: "restrict" }),
  label: text("label").notNull(),
  position: integer("position").notNull(),
  version: integer("version").notNull().default(1),
  ...timestamps,
}, (table) => [unique("session_court_position_unique").on(table.sessionId, table.position)]);

export const paymentAccounts = pgTable("payment_accounts", {
  id: uuid("id").defaultRandom().primaryKey(),
  ownerId: uuid("owner_id").notNull().references(() => users.id, { onDelete: "restrict" }),
  method: text("method").notNull(),
  label: text("label").notNull(),
  details: text("details"),
  qrStoragePath: text("qr_storage_path"),
  ...timestamps,
});

export const expenses = pgTable("expenses", {
  id: uuid("id").defaultRandom().primaryKey(),
  sessionId: uuid("session_id").notNull().references(() => sessions.id, { onDelete: "restrict" }),
  kind: expenseKind("kind").notNull(),
  label: text("label").notNull(),
  totalCents: integer("total_cents").notNull(),
  paidById: uuid("paid_by_id").references(() => users.id, { onDelete: "restrict" }),
  paymentAccountId: uuid("payment_account_id").references(() => paymentAccounts.id, { onDelete: "set null" }),
  ...timestamps,
}, (table) => [check("expense_total_nonnegative", sql`${table.totalCents} >= 0`)]);

export const playerPayments = pgTable("player_payments", {
  id: uuid("id").defaultRandom().primaryKey(),
  expenseId: uuid("expense_id").notNull().references(() => expenses.id, { onDelete: "restrict" }),
  sessionPlayerId: uuid("session_player_id").notNull().references(() => sessionPlayers.id, { onDelete: "restrict" }),
  amountCents: integer("amount_cents").notNull(),
  status: paymentStatus("status").notNull().default("unpaid"),
  sentAt: timestamp("sent_at", { withTimezone: true }),
  proofStoragePath: text("proof_storage_path"),
  reviewNote: text("review_note"),
  confirmedAt: timestamp("confirmed_at", { withTimezone: true }),
  confirmedById: uuid("confirmed_by_id").references(() => users.id, { onDelete: "restrict" }),
  ...timestamps,
}, (table) => [
  unique("expense_player_unique").on(table.expenseId, table.sessionPlayerId),
  check("payment_amount_nonnegative", sql`${table.amountCents} >= 0`),
]);

export const matches = pgTable("matches", {
  id: uuid("id").defaultRandom().primaryKey(),
  sessionId: uuid("session_id").notNull().references(() => sessions.id, { onDelete: "restrict" }),
  courtId: uuid("court_id").references(() => courts.id, { onDelete: "set null" }),
  courtLabel: text("court_label").notNull(),
  format: text("format").notNull().default("doubles"),
  status: matchStatus("status").notNull().default("scheduled"),
  teamAScore: integer("team_a_score").notNull().default(0),
  teamBScore: integer("team_b_score").notNull().default(0),
  winningTeam: text("winning_team"),
  startedAt: timestamp("started_at", { withTimezone: true }),
  finishedAt: timestamp("finished_at", { withTimezone: true }),
  version: integer("version").notNull().default(1),
  ...timestamps,
}, (table) => [check("match_scores_nonnegative", sql`${table.teamAScore} >= 0 and ${table.teamBScore} >= 0`)]);

export const matchPlayers = pgTable("match_players", {
  matchId: uuid("match_id").notNull().references(() => matches.id, { onDelete: "restrict" }),
  sessionPlayerId: uuid("session_player_id").notNull().references(() => sessionPlayers.id, { onDelete: "restrict" }),
  team: text("team").notNull(),
  position: integer("position").notNull(),
}, (table) => [primaryKey({ columns: [table.matchId, table.sessionPlayerId] })]);

export const matchScores = pgTable("match_scores", {
  id: uuid("id").defaultRandom().primaryKey(),
  matchId: uuid("match_id").notNull().references(() => matches.id, { onDelete: "restrict" }),
  teamAScore: integer("team_a_score").notNull(),
  teamBScore: integer("team_b_score").notNull(),
  recordedById: uuid("recorded_by_id").notNull().references(() => users.id, { onDelete: "restrict" }),
  sequence: integer("sequence").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [unique("match_score_sequence_unique").on(table.matchId, table.sequence)]);

export const sessionQueue = pgTable("session_queue", {
  sessionId: uuid("session_id").notNull().references(() => sessions.id, { onDelete: "restrict" }),
  sessionPlayerId: uuid("session_player_id").notNull().references(() => sessionPlayers.id, { onDelete: "restrict" }),
  position: integer("position").notNull(),
  state: playerState("state").notNull().default("waiting"),
  enteredAt: timestamp("entered_at", { withTimezone: true }).notNull().defaultNow(),
  version: integer("version").notNull().default(1),
}, (table) => [
  primaryKey({ columns: [table.sessionId, table.sessionPlayerId] }),
  unique("session_queue_position_unique").on(table.sessionId, table.position),
]);

export const messages = pgTable("messages", {
  id: uuid("id").defaultRandom().primaryKey(),
  sessionId: uuid("session_id").notNull().references(() => sessions.id, { onDelete: "restrict" }),
  authorId: uuid("author_id").references(() => users.id, { onDelete: "restrict" }),
  sessionPlayerId: uuid("session_player_id").references(() => sessionPlayers.id, { onDelete: "restrict" }),
  kind: text("kind").notNull().default("text"),
  body: text("body"),
  imagePath: text("image_path"),
  ...timestamps,
});

export const messageReactions = pgTable("message_reactions", {
  messageId: uuid("message_id").notNull().references(() => messages.id, { onDelete: "cascade" }),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  reaction: text("reaction").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [primaryKey({ columns: [table.messageId, table.userId, table.reaction] })]);

export const memories = pgTable("memories", {
  id: uuid("id").defaultRandom().primaryKey(),
  sessionId: uuid("session_id").notNull().unique().references(() => sessions.id, { onDelete: "restrict" }),
  coverMediaId: uuid("cover_media_id"),
  ...timestamps,
});

export const memoryMedia = pgTable("memory_media", {
  id: uuid("id").defaultRandom().primaryKey(),
  memoryId: uuid("memory_id").notNull().references(() => memories.id, { onDelete: "cascade" }),
  uploaderId: uuid("uploader_id").references(() => users.id, { onDelete: "restrict" }),
  storagePath: text("storage_path").notNull(),
  mediaType: text("media_type").notNull(),
  altText: text("alt_text"),
  caption: text("caption"),
  ...timestamps,
});

export const comments = pgTable("comments", {
  id: uuid("id").defaultRandom().primaryKey(),
  memoryId: uuid("memory_id").notNull().references(() => memories.id, { onDelete: "cascade" }),
  authorId: uuid("author_id").notNull().references(() => users.id, { onDelete: "restrict" }),
  body: text("body").notNull(),
  ...timestamps,
});

export const reactions = pgTable("reactions", {
  memoryId: uuid("memory_id").notNull().references(() => memories.id, { onDelete: "cascade" }),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  reaction: text("reaction").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [primaryKey({ columns: [table.memoryId, table.userId, table.reaction] })]);

export const notifications = pgTable("notifications", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  sessionId: uuid("session_id").references(() => sessions.id, { onDelete: "cascade" }),
  type: text("type").notNull(),
  payload: jsonb("payload").$type<Record<string, unknown>>().notNull().default({}),
  readAt: timestamp("read_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [index("notifications_user_unread_idx").on(table.userId, table.readAt)]);

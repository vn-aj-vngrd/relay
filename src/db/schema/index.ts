import { sql } from "drizzle-orm";
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
  time,
  timestamp,
  unique,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

const timestamps = {
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
};

export const sessionStatus = pgEnum("session_status", ["draft", "published", "live", "completed", "cancelled"]);
export const visibility = pgEnum("visibility", ["public", "link", "private"]);
export const rsvpStatus = pgEnum("rsvp_status", ["invited", "pending", "going", "maybe", "waitlisted", "declined"]);
export const playerState = pgEnum("player_state", ["available", "playing", "waiting", "resting", "unavailable"]);
export const memberRole = pgEnum("member_role", ["owner", "admin", "member"]);
export const sessionRole = pgEnum("session_role", ["host", "cohost", "player"]);
export const matchStatus = pgEnum("match_status", ["scheduled", "active", "completed", "cancelled"]);
export const paymentStatus = pgEnum("payment_status", ["unpaid", "sent", "confirmed", "excluded"]);
export const expenseKind = pgEnum("expense_kind", ["court", "ball", "paddle_rental", "drinks", "other"]);
export const rotationMode = pgEnum("rotation_mode", [
  "manual",
  "queue",
  "random",
  "winner_stays",
  "king_of_court",
  "round_robin",
  "balanced",
]);
export const feedbackType = pgEnum("feedback_type", ["bug", "feature", "general"]);
export const feedbackStatus = pgEnum("feedback_status", ["new", "reviewing", "planned", "resolved", "closed"]);
export const venueListingStatus = pgEnum("venue_listing_status", [
  "unverified",
  "pending",
  "verified",
  "rejected",
  "archived",
]);
export const venueParkingStatus = pgEnum("venue_parking_status", ["available", "unavailable"]);
export const venueAccessType = pgEnum("venue_access_type", [
  "unknown",
  "public",
  "commercial",
  "members",
  "residents",
  "school_or_community",
  "invitation",
]);
export const venueReservationPolicy = pgEnum("venue_reservation_policy", [
  "unknown",
  "walk_in",
  "reservation_required",
  "walk_in_or_reserve",
  "contact",
]);
export const venueOperationalStatus = pgEnum("venue_operational_status", [
  "unknown",
  "operating",
  "temporarily_closed",
  "seasonal",
  "opening_soon",
  "permanently_closed",
]);
export const venueChangeRequestType = pgEnum("venue_change_request_type", ["create", "update"]);
export const venueChangeRequestStatus = pgEnum("venue_change_request_status", [
  "submitted",
  "needs_info",
  "in_review",
  "approved",
  "partially_approved",
  "rejected",
  "duplicate",
  "withdrawn",
]);
export const venuePriceUnit = pgEnum("venue_price_unit", [
  "hour",
  "player",
  "court",
  "session",
  "court_hour",
  "player_session",
]);
export const venuePriceStatus = pgEnum("venue_price_status", [
  "unknown",
  "free",
  "paid",
  "contact",
  "donation",
  "members",
  "invitation",
]);

export const users = pgTable(
  "users",
  {
    id: uuid("id").primaryKey(), // Mirrors auth.users; deletion is handled by an anonymization job.
    email: text("email").notNull().unique(),
    suspendedAt: timestamp("suspended_at", { withTimezone: true }),
    suspensionReason: text("suspension_reason"),
    suspendedById: uuid("suspended_by_id"),
    deletedAt: timestamp("deleted_at", { withTimezone: true }),
    ...timestamps,
  },
  (table) => [index("users_created_id_idx").on(table.createdAt.desc(), table.id.desc())],
);

export const profiles = pgTable("profiles", {
  userId: uuid("user_id")
    .primaryKey()
    .references(() => users.id, { onDelete: "cascade" }),
  username: text("username").notNull().unique(),
  name: text("name").notNull(),
  avatarPath: text("avatar_path"),
  bio: text("bio"),
  skillLevel: text("skill_level"),
  dominantHand: text("dominant_hand"),
  city: text("city"),
  discoverySource: text("discovery_source"),
  onboardingCompletedAt: timestamp("onboarding_completed_at", { withTimezone: true }),
  productTourCompletedAt: timestamp("product_tour_completed_at", { withTimezone: true }),
  ...timestamps,
});

export const venues = pgTable(
  "venues",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    slug: text("slug").notNull().unique(),
    name: text("name").notNull(),
    address: text("address").notNull(),
    latitude: numeric("latitude", { precision: 9, scale: 6 }),
    longitude: numeric("longitude", { precision: 9, scale: 6 }),
    environment: text("environment"),
    courtCount: integer("court_count"),
    accessType: venueAccessType("access_type").notNull().default("unknown"),
    reservationPolicy: venueReservationPolicy("reservation_policy").notNull().default("unknown"),
    operationalStatus: venueOperationalStatus("operational_status").notNull().default("unknown"),
    priceStatus: venuePriceStatus("price_status").notNull().default("unknown"),
    priceAmountCents: integer("price_amount_cents"),
    priceMaxCents: integer("price_max_cents"),
    priceUnit: venuePriceUnit("price_unit"),
    parkingStatus: venueParkingStatus("parking_status"),
    amenities: text("amenities").array(),
    paddleRental: boolean("paddle_rental").notNull().default(false),
    contact: text("contact"),
    websiteUrl: text("website_url"),
    socialUrl: text("social_url"),
    bookingUrl: text("booking_url"),
    listingStatus: venueListingStatus("listing_status").notNull().default("verified"),
    source: text("source").notNull().default("manual"),
    sourceExternalId: text("source_external_id"),
    sourceUrl: text("source_url"),
    submittedById: uuid("submitted_by_id").references(() => users.id, { onDelete: "set null" }),
    verificationNote: text("verification_note"),
    verifiedAt: timestamp("verified_at", { withTimezone: true }),
    verifiedById: uuid("verified_by_id").references(() => users.id, { onDelete: "set null" }),
    lastSeenAt: timestamp("last_seen_at", { withTimezone: true }),
    ...timestamps,
  },
  (table) => [
    uniqueIndex("venues_source_external_id_idx").on(table.source, table.sourceExternalId),
    index("venues_updated_id_idx").on(table.updatedAt.desc(), table.id.desc()),
    index("venues_listing_environment_idx").on(table.listingStatus, table.environment),
    index("venues_listing_parking_idx").on(table.listingStatus, table.parkingStatus),
    index("venues_listing_price_idx").on(table.listingStatus, table.priceStatus, table.priceAmountCents),
    check("venues_price_amount_nonnegative", sql`${table.priceAmountCents} is null or ${table.priceAmountCents} >= 0`),
    check(
      "venues_price_max_valid",
      sql`${table.priceMaxCents} is null or (${table.priceAmountCents} is not null and ${table.priceMaxCents} >= ${table.priceAmountCents})`,
    ),
    check(
      "venues_price_complete",
      sql`(${table.priceStatus} = 'paid' and ${table.priceAmountCents} is not null and ${table.priceUnit} is not null) or (${table.priceStatus} = 'free' and ${table.priceAmountCents} = 0 and ${table.priceUnit} is null and ${table.priceMaxCents} is null) or (${table.priceStatus} not in ('paid', 'free') and ${table.priceAmountCents} is null and ${table.priceUnit} is null and ${table.priceMaxCents} is null)`,
    ),
  ],
);

export const venueChangeRequests = pgTable(
  "venue_change_requests",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    requestType: venueChangeRequestType("request_type").notNull(),
    venueId: uuid("venue_id").references(() => venues.id, { onDelete: "set null" }),
    proposedChanges: jsonb("proposed_changes").$type<Record<string, unknown>>().notNull(),
    evidenceUrls: text("evidence_urls")
      .array()
      .notNull()
      .default(sql`'{}'::text[]`),
    note: text("note"),
    status: venueChangeRequestStatus("status").notNull().default("submitted"),
    submittedById: uuid("submitted_by_id").references(() => users.id, { onDelete: "set null" }),
    reviewedById: uuid("reviewed_by_id").references(() => users.id, { onDelete: "set null" }),
    reviewedAt: timestamp("reviewed_at", { withTimezone: true }),
    resolutionNote: text("resolution_note"),
    ...timestamps,
  },
  (table) => [
    index("venue_change_requests_status_created_idx").on(table.status, table.createdAt.desc(), table.id.desc()),
    index("venue_change_requests_venue_created_idx").on(table.venueId, table.createdAt.desc()),
    index("venue_change_requests_submitter_created_idx").on(table.submittedById, table.createdAt.desc()),
  ],
);

export const venueOperatingPeriods = pgTable(
  "venue_operating_periods",
  {
    venueId: uuid("venue_id")
      .notNull()
      .references(() => venues.id, { onDelete: "cascade" }),
    dayOfWeek: integer("day_of_week").notNull(),
    sequence: integer("sequence").notNull().default(0),
    opensAt: time("opens_at", { precision: 0 }).notNull(),
    closesAt: time("closes_at", { precision: 0 }).notNull(),
  },
  (table) => [
    primaryKey({ columns: [table.venueId, table.dayOfWeek, table.sequence] }),
    index("venue_operating_periods_venue_day_idx").on(table.venueId, table.dayOfWeek),
    check("venue_operating_periods_day_valid", sql`${table.dayOfWeek} between 1 and 7`),
    check("venue_operating_periods_sequence_nonnegative", sql`${table.sequence} >= 0`),
  ],
);

export const venuePhotos = pgTable("venue_photos", {
  id: uuid("id").defaultRandom().primaryKey(),
  venueId: uuid("venue_id")
    .notNull()
    .references(() => venues.id, { onDelete: "cascade" }),
  storagePath: text("storage_path").notNull(),
  altText: text("alt_text").notNull(),
  sortOrder: integer("sort_order").notNull().default(0),
  ...timestamps,
});

export const groups = pgTable("groups", {
  id: uuid("id").defaultRandom().primaryKey(),
  slug: text("slug").notNull().unique(),
  ownerId: uuid("owner_id")
    .notNull()
    .references(() => users.id, { onDelete: "restrict" }),
  name: text("name").notNull(),
  description: text("description"),
  imagePath: text("image_path"),
  ...timestamps,
});

export const groupMembers = pgTable(
  "group_members",
  {
    groupId: uuid("group_id")
      .notNull()
      .references(() => groups.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "restrict" }),
    role: memberRole("role").notNull().default("member"),
    joinedAt: timestamp("joined_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    primaryKey({ columns: [table.groupId, table.userId] }),
    index("group_members_user_joined_idx").on(table.userId, table.joinedAt, table.groupId),
  ],
);

export const sessions = pgTable(
  "sessions",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    slug: text("slug").notNull().unique(),
    hostId: uuid("host_id")
      .notNull()
      .references(() => users.id, { onDelete: "restrict" }),
    groupId: uuid("group_id").references(() => groups.id, { onDelete: "set null" }),
    venueId: uuid("venue_id").references(() => venues.id, { onDelete: "set null" }),
    venueName: text("venue_name").notNull(),
    venueAddress: text("venue_address"),
    title: text("title").notNull(),
    accentColor: text("accent_color").notNull().default("violet"),
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
    roundDurationMinutes: integer("round_duration_minutes"),
    rosterLocked: boolean("roster_locked").notNull().default(false),
    requiresApproval: boolean("requires_approval").notNull().default(false),
    bookedAt: timestamp("booked_at", { withTimezone: true }),
    bookingReference: text("booking_reference"),
    bookingScreenshotPath: text("booking_screenshot_path"),
    bookingTotalCents: integer("booking_total_cents"),
    bookingNotes: text("booking_notes"),
    version: integer("version").notNull().default(1),
    publishedAt: timestamp("published_at", { withTimezone: true }),
    completedAt: timestamp("completed_at", { withTimezone: true }),
    ...timestamps,
  },
  (table) => [
    check("session_capacity_positive", sql`${table.capacity} >= 2`),
    check("session_courts_positive", sql`${table.courtCount} >= 1`),
    check(
      "session_round_duration_valid",
      sql`${table.roundDurationMinutes} is null or ${table.roundDurationMinutes} between 5 and 60`,
    ),
    check("session_time_valid", sql`${table.endsAt} > ${table.startsAt}`),
    check(
      "session_public_cost_required",
      sql`${table.visibility} <> 'public' or ${table.estimatedCostCents} is not null`,
    ),
    index("sessions_starts_at_idx").on(table.startsAt),
    index("sessions_public_discovery_idx").on(table.visibility, table.status, table.endsAt, table.startsAt, table.id),
    index("sessions_starts_id_idx").on(table.startsAt.desc(), table.id.desc()),
    index("sessions_group_starts_id_idx").on(table.groupId, table.startsAt.desc(), table.id.desc()),
  ],
);

export const sessionPlayers = pgTable(
  "session_players",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    sessionId: uuid("session_id")
      .notNull()
      .references(() => sessions.id, { onDelete: "restrict" }),
    userId: uuid("user_id").references(() => users.id, { onDelete: "restrict" }),
    guestName: text("guest_name"),
    guestTokenHash: text("guest_token_hash"),
    skillLevel: text("skill_level"),
    role: sessionRole("role").notNull().default("player"),
    rsvp: rsvpStatus("rsvp").notNull().default("invited"),
    playState: playerState("play_state").notNull().default("unavailable"),
    checkedInAt: timestamp("checked_in_at", { withTimezone: true }),
    waitlistPosition: integer("waitlist_position"),
    invitedAt: timestamp("invited_at", { withTimezone: true }).notNull().defaultNow(),
    respondedAt: timestamp("responded_at", { withTimezone: true }),
    leftAt: timestamp("left_at", { withTimezone: true }),
    ...timestamps,
  },
  (table) => [
    unique("session_user_unique").on(table.sessionId, table.userId),
    check("player_identity_present", sql`${table.userId} is not null or ${table.guestName} is not null`),
    index("session_players_roster_idx").on(table.sessionId, table.rsvp),
    index("session_players_user_rsvp_idx").on(table.userId, table.rsvp, table.sessionId),
  ],
);

export const sessionInvites = pgTable("session_invites", {
  id: uuid("id").defaultRandom().primaryKey(),
  sessionId: uuid("session_id")
    .notNull()
    .references(() => sessions.id, { onDelete: "cascade" }),
  invitedById: uuid("invited_by_id")
    .notNull()
    .references(() => users.id, { onDelete: "restrict" }),
  email: text("email"),
  tokenHash: text("token_hash").notNull().unique(),
  expiresAt: timestamp("expires_at", { withTimezone: true }),
  acceptedAt: timestamp("accepted_at", { withTimezone: true }),
  ...timestamps,
});

export const courts = pgTable(
  "courts",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    sessionId: uuid("session_id")
      .notNull()
      .references(() => sessions.id, { onDelete: "restrict" }),
    label: text("label").notNull(),
    position: integer("position").notNull(),
    version: integer("version").notNull().default(1),
    ...timestamps,
  },
  (table) => [unique("session_court_position_unique").on(table.sessionId, table.position)],
);

export const paymentAccounts = pgTable("payment_accounts", {
  id: uuid("id").defaultRandom().primaryKey(),
  ownerId: uuid("owner_id")
    .notNull()
    .references(() => users.id, { onDelete: "restrict" }),
  method: text("method").notNull(),
  label: text("label").notNull(),
  details: text("details"),
  qrStoragePath: text("qr_storage_path"),
  ...timestamps,
});

export const expenses = pgTable(
  "expenses",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    sessionId: uuid("session_id")
      .notNull()
      .references(() => sessions.id, { onDelete: "restrict" }),
    kind: expenseKind("kind").notNull(),
    label: text("label").notNull(),
    totalCents: integer("total_cents").notNull(),
    paidById: uuid("paid_by_id").references(() => users.id, { onDelete: "restrict" }),
    paymentAccountId: uuid("payment_account_id").references(() => paymentAccounts.id, { onDelete: "set null" }),
    receiptStoragePath: text("receipt_storage_path"),
    ...timestamps,
  },
  (table) => [check("expense_total_nonnegative", sql`${table.totalCents} >= 0`)],
);

export const playerPayments = pgTable(
  "player_payments",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    expenseId: uuid("expense_id")
      .notNull()
      .references(() => expenses.id, { onDelete: "restrict" }),
    sessionPlayerId: uuid("session_player_id")
      .notNull()
      .references(() => sessionPlayers.id, { onDelete: "restrict" }),
    amountCents: integer("amount_cents").notNull(),
    status: paymentStatus("status").notNull().default("unpaid"),
    sentAt: timestamp("sent_at", { withTimezone: true }),
    proofStoragePath: text("proof_storage_path"),
    reviewNote: text("review_note"),
    confirmedAt: timestamp("confirmed_at", { withTimezone: true }),
    confirmedById: uuid("confirmed_by_id").references(() => users.id, { onDelete: "restrict" }),
    ...timestamps,
  },
  (table) => [
    unique("expense_player_unique").on(table.expenseId, table.sessionPlayerId),
    check("payment_amount_nonnegative", sql`${table.amountCents} >= 0`),
  ],
);

export const matches = pgTable(
  "matches",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    sessionId: uuid("session_id")
      .notNull()
      .references(() => sessions.id, { onDelete: "restrict" }),
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
  },
  (table) => [check("match_scores_nonnegative", sql`${table.teamAScore} >= 0 and ${table.teamBScore} >= 0`)],
);

export const matchPlayers = pgTable(
  "match_players",
  {
    matchId: uuid("match_id")
      .notNull()
      .references(() => matches.id, { onDelete: "restrict" }),
    sessionPlayerId: uuid("session_player_id")
      .notNull()
      .references(() => sessionPlayers.id, { onDelete: "restrict" }),
    team: text("team").notNull(),
    position: integer("position").notNull(),
  },
  (table) => [
    primaryKey({ columns: [table.matchId, table.sessionPlayerId] }),
    index("match_players_session_player_idx").on(table.sessionPlayerId, table.matchId),
  ],
);

export const matchScores = pgTable(
  "match_scores",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    matchId: uuid("match_id")
      .notNull()
      .references(() => matches.id, { onDelete: "restrict" }),
    teamAScore: integer("team_a_score").notNull(),
    teamBScore: integer("team_b_score").notNull(),
    recordedById: uuid("recorded_by_id")
      .notNull()
      .references(() => users.id, { onDelete: "restrict" }),
    sequence: integer("sequence").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [unique("match_score_sequence_unique").on(table.matchId, table.sequence)],
);

export const sessionQueue = pgTable(
  "session_queue",
  {
    sessionId: uuid("session_id")
      .notNull()
      .references(() => sessions.id, { onDelete: "restrict" }),
    sessionPlayerId: uuid("session_player_id")
      .notNull()
      .references(() => sessionPlayers.id, { onDelete: "restrict" }),
    position: integer("position").notNull(),
    state: playerState("state").notNull().default("waiting"),
    enteredAt: timestamp("entered_at", { withTimezone: true }).notNull().defaultNow(),
    version: integer("version").notNull().default(1),
  },
  (table) => [
    primaryKey({ columns: [table.sessionId, table.sessionPlayerId] }),
    unique("session_queue_position_unique").on(table.sessionId, table.position),
  ],
);

export const sessionPairs = pgTable(
  "session_pairs",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    sessionId: uuid("session_id")
      .notNull()
      .references(() => sessions.id, { onDelete: "restrict" }),
    position: integer("position").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    unique("session_pair_position_unique").on(table.sessionId, table.position),
    check("session_pair_position_positive", sql`${table.position} >= 1`),
  ],
);

export const sessionPairMembers = pgTable(
  "session_pair_members",
  {
    pairId: uuid("pair_id")
      .notNull()
      .references(() => sessionPairs.id, { onDelete: "cascade" }),
    sessionPlayerId: uuid("session_player_id")
      .notNull()
      .references(() => sessionPlayers.id, { onDelete: "restrict" }),
    position: integer("position").notNull(),
  },
  (table) => [
    primaryKey({ columns: [table.pairId, table.sessionPlayerId] }),
    unique("session_pair_member_position_unique").on(table.pairId, table.position),
    unique("session_pair_player_unique").on(table.sessionPlayerId),
    check("session_pair_member_position_valid", sql`${table.position} in (1, 2)`),
  ],
);

export const messages = pgTable(
  "messages",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    sessionId: uuid("session_id")
      .notNull()
      .references(() => sessions.id, { onDelete: "restrict" }),
    authorId: uuid("author_id").references(() => users.id, { onDelete: "restrict" }),
    sessionPlayerId: uuid("session_player_id").references(() => sessionPlayers.id, { onDelete: "restrict" }),
    kind: text("kind").notNull().default("text"),
    body: text("body"),
    imagePath: text("image_path"),
    ...timestamps,
  },
  (table) => [index("messages_session_created_id_idx").on(table.sessionId, table.createdAt.desc(), table.id.desc())],
);

export const messageReactions = pgTable(
  "message_reactions",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    messageId: uuid("message_id")
      .notNull()
      .references(() => messages.id, { onDelete: "cascade" }),
    sessionPlayerId: uuid("session_player_id")
      .notNull()
      .references(() => sessionPlayers.id, { onDelete: "cascade" }),
    userId: uuid("user_id").references(() => users.id, { onDelete: "cascade" }),
    reaction: text("reaction").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [unique("message_player_reaction_unique").on(table.messageId, table.sessionPlayerId, table.reaction)],
);

export const memories = pgTable("memories", {
  id: uuid("id").defaultRandom().primaryKey(),
  sessionId: uuid("session_id")
    .notNull()
    .unique()
    .references(() => sessions.id, { onDelete: "restrict" }),
  coverMediaId: uuid("cover_media_id"),
  ...timestamps,
});

export const memoryMedia = pgTable("memory_media", {
  id: uuid("id").defaultRandom().primaryKey(),
  memoryId: uuid("memory_id")
    .notNull()
    .references(() => memories.id, { onDelete: "cascade" }),
  uploaderId: uuid("uploader_id").references(() => users.id, { onDelete: "restrict" }),
  storagePath: text("storage_path").notNull(),
  mediaType: text("media_type").notNull(),
  altText: text("alt_text"),
  caption: text("caption"),
  ...timestamps,
});

export const comments = pgTable("comments", {
  id: uuid("id").defaultRandom().primaryKey(),
  memoryId: uuid("memory_id")
    .notNull()
    .references(() => memories.id, { onDelete: "cascade" }),
  authorId: uuid("author_id")
    .notNull()
    .references(() => users.id, { onDelete: "restrict" }),
  body: text("body").notNull(),
  ...timestamps,
});

export const reactions = pgTable(
  "reactions",
  {
    memoryId: uuid("memory_id")
      .notNull()
      .references(() => memories.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    reaction: text("reaction").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [primaryKey({ columns: [table.memoryId, table.userId, table.reaction] })],
);

export const notifications = pgTable(
  "notifications",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    sessionId: uuid("session_id").references(() => sessions.id, { onDelete: "cascade" }),
    type: text("type").notNull(),
    payload: jsonb("payload").$type<Record<string, unknown>>().notNull().default({}),
    dedupeKey: text("dedupe_key").unique(),
    readAt: timestamp("read_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("notifications_user_unread_idx").on(table.userId, table.readAt),
    index("notifications_user_created_id_idx").on(table.userId, table.createdAt.desc(), table.id.desc()),
  ],
);

export type NotificationCategoryPreferences = {
  invitations: boolean;
  roster: boolean;
  reminders: boolean;
  changes: boolean;
  booking: boolean;
  payments: boolean;
  recap: boolean;
};

export const notificationPreferences = pgTable("notification_preferences", {
  userId: uuid("user_id")
    .primaryKey()
    .references(() => users.id, { onDelete: "cascade" }),
  emailEnabled: boolean("email_enabled").notNull().default(false),
  pushEnabled: boolean("push_enabled").notNull().default(false),
  emailCategories: jsonb("email_categories").$type<NotificationCategoryPreferences>().notNull(),
  pushCategories: jsonb("push_categories").$type<NotificationCategoryPreferences>().notNull(),
  dayBeforeReminder: boolean("day_before_reminder").notNull().default(true),
  hourBeforeReminder: boolean("hour_before_reminder").notNull().default(true),
  quietHoursStart: time("quiet_hours_start"),
  quietHoursEnd: time("quiet_hours_end"),
  timeZone: text("time_zone").notNull().default("Asia/Manila"),
  ...timestamps,
});

export const pushSubscriptions = pgTable(
  "push_subscriptions",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    endpoint: text("endpoint").notNull().unique(),
    p256dh: text("p256dh").notNull(),
    auth: text("auth").notNull(),
    deviceLabel: text("device_label"),
    lastUsedAt: timestamp("last_used_at", { withTimezone: true }).notNull().defaultNow(),
    ...timestamps,
  },
  (table) => [index("push_subscriptions_user_idx").on(table.userId, table.createdAt)],
);

export const notificationDeliveries = pgTable(
  "notification_deliveries",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    notificationId: uuid("notification_id")
      .notNull()
      .references(() => notifications.id, { onDelete: "cascade" }),
    channel: text("channel").notNull(),
    destinationKey: text("destination_key").notNull(),
    pushSubscriptionId: uuid("push_subscription_id").references(() => pushSubscriptions.id, {
      onDelete: "set null",
    }),
    status: text("status").notNull().default("pending"),
    attempts: integer("attempts").notNull().default(0),
    nextAttemptAt: timestamp("next_attempt_at", { withTimezone: true }).notNull().defaultNow(),
    sentAt: timestamp("sent_at", { withTimezone: true }),
    errorCode: text("error_code"),
    ...timestamps,
  },
  (table) => [
    unique("notification_delivery_destination_unique").on(table.notificationId, table.channel, table.destinationKey),
    index("notification_delivery_pending_idx").on(table.status, table.nextAttemptAt),
  ],
);

export const productEvents = pgTable(
  "product_events",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    name: text("name").notNull(),
    userId: uuid("user_id").references(() => users.id, { onDelete: "set null" }),
    sessionId: uuid("session_id").references(() => sessions.id, { onDelete: "set null" }),
    source: text("source").notNull().default("server"),
    metadata: jsonb("metadata").$type<Record<string, string | number | boolean | null>>().notNull().default({}),
    dedupeKey: text("dedupe_key").unique(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("product_events_name_created_idx").on(table.name, table.createdAt),
    index("product_events_session_created_idx").on(table.sessionId, table.createdAt),
  ],
);

export const feedbackSubmissions = pgTable(
  "feedback_submissions",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "restrict" }),
    sessionId: uuid("session_id").references(() => sessions.id, { onDelete: "set null" }),
    experience: text("experience"),
    type: feedbackType("type").notNull(),
    status: feedbackStatus("status").notNull().default("new"),
    area: text("area").notNull().default("general"),
    title: text("title").notNull(),
    description: text("description").notNull(),
    pagePath: text("page_path"),
    contactAllowed: boolean("contact_allowed").notNull().default(true),
    adminNote: text("admin_note"),
    reviewedById: uuid("reviewed_by_id").references(() => users.id, { onDelete: "restrict" }),
    reviewedAt: timestamp("reviewed_at", { withTimezone: true }),
    resolvedAt: timestamp("resolved_at", { withTimezone: true }),
    ...timestamps,
  },
  (table) => [
    index("feedback_status_created_idx").on(table.status, table.createdAt),
    index("feedback_type_created_idx").on(table.type, table.createdAt),
    unique("feedback_user_session_unique").on(table.userId, table.sessionId),
    check("feedback_experience_valid", sql`${table.experience} is null or ${table.experience} in ('smooth', 'issues')`),
    index("feedback_user_created_idx").on(table.userId, table.createdAt),
    index("feedback_created_id_idx").on(table.createdAt.desc(), table.id.desc()),
  ],
);

export const signupSettings = pgTable(
  "signup_settings",
  {
    id: text("id").primaryKey().default("global"),
    accountCap: integer("account_cap").notNull().default(200),
    updatedById: uuid("updated_by_id").references(() => users.id, { onDelete: "set null" }),
    ...timestamps,
  },
  (table) => [
    check("signup_settings_singleton", sql`${table.id} = 'global'`),
    check("signup_account_cap_valid", sql`${table.accountCap} between 1 and 50000`),
  ],
);

export const rateLimitBuckets = pgTable(
  "rate_limit_buckets",
  {
    key: text("key").primaryKey(),
    count: integer("count").notNull().default(1),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [index("rate_limit_buckets_expires_idx").on(table.expiresAt)],
);

export const adminAuditLogs = pgTable(
  "admin_audit_logs",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    actorUserId: uuid("actor_user_id")
      .notNull()
      .references(() => users.id, { onDelete: "restrict" }),
    action: text("action").notNull(),
    targetType: text("target_type").notNull(),
    targetId: text("target_id").notNull(),
    reason: text("reason"),
    metadata: jsonb("metadata").$type<Record<string, unknown>>().notNull().default({}),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("admin_audit_created_at_idx").on(table.createdAt),
    index("admin_audit_created_id_idx").on(table.createdAt.desc(), table.id.desc()),
    index("admin_audit_target_idx").on(table.targetType, table.targetId),
  ],
);

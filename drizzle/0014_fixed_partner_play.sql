ALTER TYPE "public"."rotation_mode" ADD VALUE 'round_robin';--> statement-breakpoint
CREATE TABLE "session_pair_members" (
	"pair_id" uuid NOT NULL,
	"session_player_id" uuid NOT NULL,
	"position" integer NOT NULL,
	CONSTRAINT "session_pair_members_pair_id_session_player_id_pk" PRIMARY KEY("pair_id","session_player_id"),
	CONSTRAINT "session_pair_member_position_unique" UNIQUE("pair_id","position"),
	CONSTRAINT "session_pair_player_unique" UNIQUE("session_player_id"),
	CONSTRAINT "session_pair_member_position_valid" CHECK ("session_pair_members"."position" in (1, 2))
);
--> statement-breakpoint
CREATE TABLE "session_pairs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"session_id" uuid NOT NULL,
	"position" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "session_pair_position_unique" UNIQUE("session_id","position"),
	CONSTRAINT "session_pair_position_positive" CHECK ("session_pairs"."position" >= 1)
);
--> statement-breakpoint
ALTER TABLE "session_pair_members" ADD CONSTRAINT "session_pair_members_pair_id_session_pairs_id_fk" FOREIGN KEY ("pair_id") REFERENCES "public"."session_pairs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "session_pair_members" ADD CONSTRAINT "session_pair_members_session_player_id_session_players_id_fk" FOREIGN KEY ("session_player_id") REFERENCES "public"."session_players"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "session_pairs" ADD CONSTRAINT "session_pairs_session_id_sessions_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."sessions"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "session_pairs" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "session_pair_members" ENABLE ROW LEVEL SECURITY;
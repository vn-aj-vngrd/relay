CREATE TABLE "product_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"user_id" uuid,
	"session_id" uuid,
	"source" text DEFAULT 'server' NOT NULL,
	"metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "notifications" ADD COLUMN "dedupe_key" text;--> statement-breakpoint
ALTER TABLE "session_players" ADD COLUMN "checked_in_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "sessions" ADD COLUMN "round_duration_minutes" integer;--> statement-breakpoint
ALTER TABLE "product_events" ADD CONSTRAINT "product_events_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_events" ADD CONSTRAINT "product_events_session_id_sessions_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."sessions"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "product_events_name_created_idx" ON "product_events" USING btree ("name","created_at");--> statement-breakpoint
CREATE INDEX "product_events_session_created_idx" ON "product_events" USING btree ("session_id","created_at");--> statement-breakpoint
ALTER TABLE "product_events" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_dedupe_key_unique" UNIQUE("dedupe_key");--> statement-breakpoint
ALTER TABLE "sessions" ADD CONSTRAINT "session_round_duration_valid" CHECK ("sessions"."round_duration_minutes" is null or "sessions"."round_duration_minutes" between 5 and 60);
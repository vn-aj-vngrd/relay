ALTER TABLE "courts" ADD COLUMN "available_for_play" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "courts" ADD COLUMN "availability_changed_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "courts" ADD COLUMN "availability_changed_by_id" uuid;--> statement-breakpoint
ALTER TABLE "matches" ADD COLUMN "rotation_id" uuid;--> statement-breakpoint
ALTER TABLE "matches" ADD COLUMN "cancellation_reason" text;--> statement-breakpoint
ALTER TABLE "matches" ADD COLUMN "cancelled_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "matches" ADD COLUMN "cancelled_by_id" uuid;--> statement-breakpoint
ALTER TABLE "session_queue" ADD COLUMN "ready_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "sessions" ADD COLUMN "cancelled_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "sessions" ADD COLUMN "cancelled_by_id" uuid;--> statement-breakpoint
ALTER TABLE "sessions" ADD COLUMN "cancellation_category" text;--> statement-breakpoint
ALTER TABLE "sessions" ADD COLUMN "cancellation_reason" text;--> statement-breakpoint
ALTER TABLE "sessions" ADD COLUMN "lead_organizer_id" uuid;--> statement-breakpoint
ALTER TABLE "courts" ADD CONSTRAINT "courts_availability_changed_by_id_users_id_fk" FOREIGN KEY ("availability_changed_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "matches" ADD CONSTRAINT "matches_cancelled_by_id_users_id_fk" FOREIGN KEY ("cancelled_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_cancelled_by_id_users_id_fk" FOREIGN KEY ("cancelled_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_lead_organizer_id_users_id_fk" FOREIGN KEY ("lead_organizer_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
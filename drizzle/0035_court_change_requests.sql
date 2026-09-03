CREATE TYPE "public"."venue_access_type" AS ENUM('unknown', 'public', 'commercial', 'members', 'residents', 'school_or_community', 'invitation');--> statement-breakpoint
CREATE TYPE "public"."venue_change_request_status" AS ENUM('submitted', 'needs_info', 'in_review', 'approved', 'partially_approved', 'rejected', 'duplicate', 'withdrawn');--> statement-breakpoint
CREATE TYPE "public"."venue_change_request_type" AS ENUM('create', 'update');--> statement-breakpoint
CREATE TYPE "public"."venue_operational_status" AS ENUM('unknown', 'operating', 'temporarily_closed', 'seasonal', 'opening_soon', 'permanently_closed');--> statement-breakpoint
CREATE TYPE "public"."venue_reservation_policy" AS ENUM('unknown', 'walk_in', 'reservation_required', 'walk_in_or_reserve', 'contact');--> statement-breakpoint
CREATE TABLE "venue_change_requests" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"request_type" "venue_change_request_type" NOT NULL,
	"venue_id" uuid,
	"proposed_changes" jsonb NOT NULL,
	"evidence_urls" text[] DEFAULT '{}'::text[] NOT NULL,
	"note" text,
	"status" "venue_change_request_status" DEFAULT 'submitted' NOT NULL,
	"submitted_by_id" uuid,
	"reviewed_by_id" uuid,
	"reviewed_at" timestamp with time zone,
	"resolution_note" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "venues" ADD COLUMN "access_type" "venue_access_type" DEFAULT 'unknown' NOT NULL;--> statement-breakpoint
ALTER TABLE "venues" ADD COLUMN "reservation_policy" "venue_reservation_policy" DEFAULT 'unknown' NOT NULL;--> statement-breakpoint
ALTER TABLE "venues" ADD COLUMN "operational_status" "venue_operational_status" DEFAULT 'unknown' NOT NULL;--> statement-breakpoint
ALTER TABLE "venue_change_requests" ADD CONSTRAINT "venue_change_requests_venue_id_venues_id_fk" FOREIGN KEY ("venue_id") REFERENCES "public"."venues"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "venue_change_requests" ADD CONSTRAINT "venue_change_requests_submitted_by_id_users_id_fk" FOREIGN KEY ("submitted_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "venue_change_requests" ADD CONSTRAINT "venue_change_requests_reviewed_by_id_users_id_fk" FOREIGN KEY ("reviewed_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "venue_change_requests_status_created_idx" ON "venue_change_requests" USING btree ("status","created_at" DESC NULLS LAST,"id" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX "venue_change_requests_venue_created_idx" ON "venue_change_requests" USING btree ("venue_id","created_at" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX "venue_change_requests_submitter_created_idx" ON "venue_change_requests" USING btree ("submitted_by_id","created_at" DESC NULLS LAST);--> statement-breakpoint
ALTER TABLE "venue_change_requests" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
REVOKE ALL ON TABLE "venue_change_requests" FROM anon, authenticated;
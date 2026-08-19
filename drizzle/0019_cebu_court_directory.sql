CREATE TYPE "public"."venue_listing_status" AS ENUM('unverified', 'pending', 'verified', 'rejected', 'archived');--> statement-breakpoint
ALTER TABLE "venues" ADD COLUMN "listing_status" "venue_listing_status" DEFAULT 'verified' NOT NULL;--> statement-breakpoint
ALTER TABLE "venues" ADD COLUMN "source" text DEFAULT 'manual' NOT NULL;--> statement-breakpoint
ALTER TABLE "venues" ADD COLUMN "source_external_id" text;--> statement-breakpoint
ALTER TABLE "venues" ADD COLUMN "source_url" text;--> statement-breakpoint
ALTER TABLE "venues" ADD COLUMN "submitted_by_id" uuid;--> statement-breakpoint
ALTER TABLE "venues" ADD COLUMN "verification_note" text;--> statement-breakpoint
ALTER TABLE "venues" ADD COLUMN "verified_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "venues" ADD COLUMN "verified_by_id" uuid;--> statement-breakpoint
ALTER TABLE "venues" ADD COLUMN "last_seen_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "venues" ADD CONSTRAINT "venues_submitted_by_id_users_id_fk" FOREIGN KEY ("submitted_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "venues" ADD CONSTRAINT "venues_verified_by_id_users_id_fk" FOREIGN KEY ("verified_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "venues_source_external_id_idx" ON "venues" USING btree ("source","source_external_id");--> statement-breakpoint
DROP POLICY IF EXISTS "Public venues are readable" ON public.venues;--> statement-breakpoint
CREATE POLICY "Published venues are readable"
ON public.venues FOR SELECT TO public
USING (listing_status IN ('unverified', 'verified'));
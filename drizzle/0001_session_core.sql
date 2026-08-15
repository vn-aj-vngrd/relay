ALTER TABLE "sessions" ADD COLUMN "venue_name" text NOT NULL;--> statement-breakpoint
ALTER TABLE "sessions" ADD COLUMN "venue_address" text;--> statement-breakpoint
ALTER TABLE "sessions" ADD COLUMN "published_at" timestamp with time zone;
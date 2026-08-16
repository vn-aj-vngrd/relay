ALTER TABLE "profiles" ADD COLUMN "discovery_source" text;--> statement-breakpoint
ALTER TABLE "profiles" ADD COLUMN "onboarding_completed_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "profiles" ADD COLUMN "product_tour_completed_at" timestamp with time zone;--> statement-breakpoint
UPDATE "profiles"
SET "onboarding_completed_at" = now(),
    "product_tour_completed_at" = now();
ALTER TABLE "product_events" ADD COLUMN "dedupe_key" text;--> statement-breakpoint
ALTER TABLE "product_events" ADD CONSTRAINT "product_events_dedupe_key_unique" UNIQUE("dedupe_key");
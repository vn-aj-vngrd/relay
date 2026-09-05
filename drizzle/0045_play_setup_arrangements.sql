ALTER TABLE "sessions" ADD COLUMN "booking_not_required" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "sessions" ADD COLUMN "payment_deferred" boolean DEFAULT false NOT NULL;
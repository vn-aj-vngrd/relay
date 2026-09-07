ALTER TABLE "expenses" ADD COLUMN "contribution_mode" text DEFAULT 'split' NOT NULL;--> statement-breakpoint
ALTER TABLE "expenses" ADD COLUMN "fixed_rate_cents" integer;--> statement-breakpoint
ALTER TABLE "expenses" ADD COLUMN "consent_before" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "expenses" ADD COLUMN "items" jsonb DEFAULT '[]'::jsonb NOT NULL;--> statement-breakpoint
ALTER TABLE "player_payments" ADD COLUMN "amount_source" text DEFAULT 'legacy' NOT NULL;--> statement-breakpoint
ALTER TABLE "player_payments" ADD COLUMN "adjustment_reason" text;--> statement-breakpoint
ALTER TABLE "player_payments" ADD COLUMN "pending_adjustment" jsonb;--> statement-breakpoint
ALTER TABLE "player_payments" ADD COLUMN "adjustment_history" jsonb DEFAULT '[]'::jsonb NOT NULL;--> statement-breakpoint
ALTER TABLE "expenses" ADD CONSTRAINT "expense_contribution_rate" CHECK (("expenses"."contribution_mode" = 'split' and "expenses"."fixed_rate_cents" is null) or ("expenses"."contribution_mode" = 'fixed' and "expenses"."fixed_rate_cents" is not null and "expenses"."fixed_rate_cents" > 0));--> statement-breakpoint
ALTER TABLE "player_payments" ADD CONSTRAINT "payment_amount_source" CHECK ("player_payments"."amount_source" in ('automatic', 'manual', 'legacy'));
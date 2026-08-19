CREATE TABLE "rate_limit_buckets" (
	"key" text PRIMARY KEY NOT NULL,
	"count" integer DEFAULT 1 NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX "rate_limit_buckets_expires_idx" ON "rate_limit_buckets" USING btree ("expires_at");--> statement-breakpoint
CREATE INDEX "admin_audit_created_id_idx" ON "admin_audit_logs" USING btree ("created_at" DESC NULLS LAST,"id" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX "feedback_created_id_idx" ON "feedback_submissions" USING btree ("created_at" DESC NULLS LAST,"id" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX "sessions_starts_id_idx" ON "sessions" USING btree ("starts_at" DESC NULLS LAST,"id" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX "users_created_id_idx" ON "users" USING btree ("created_at" DESC NULLS LAST,"id" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX "venues_updated_id_idx" ON "venues" USING btree ("updated_at" DESC NULLS LAST,"id" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX "venues_pending_updated_id_idx" ON "venues" (("listing_status" = 'pending') DESC, "updated_at" DESC, "id" DESC);--> statement-breakpoint
CREATE EXTENSION IF NOT EXISTS pg_trgm;--> statement-breakpoint
CREATE INDEX "users_email_trgm_idx" ON "users" USING gin ("email" gin_trgm_ops);--> statement-breakpoint
CREATE INDEX "profiles_name_trgm_idx" ON "profiles" USING gin ("name" gin_trgm_ops);--> statement-breakpoint
CREATE INDEX "profiles_username_trgm_idx" ON "profiles" USING gin ("username" gin_trgm_ops);--> statement-breakpoint
CREATE INDEX "sessions_title_trgm_idx" ON "sessions" USING gin ("title" gin_trgm_ops);--> statement-breakpoint
CREATE INDEX "sessions_venue_name_trgm_idx" ON "sessions" USING gin ("venue_name" gin_trgm_ops);--> statement-breakpoint
CREATE INDEX "venues_name_trgm_idx" ON "venues" USING gin ("name" gin_trgm_ops);--> statement-breakpoint
CREATE INDEX "venues_address_trgm_idx" ON "venues" USING gin ("address" gin_trgm_ops);--> statement-breakpoint
CREATE INDEX "feedback_title_trgm_idx" ON "feedback_submissions" USING gin ("title" gin_trgm_ops);--> statement-breakpoint
CREATE INDEX "feedback_description_trgm_idx" ON "feedback_submissions" USING gin ("description" gin_trgm_ops);--> statement-breakpoint
ALTER TABLE "rate_limit_buckets" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
REVOKE ALL ON TABLE "rate_limit_buckets" FROM anon, authenticated, service_role;--> statement-breakpoint
CREATE OR REPLACE FUNCTION public.cleanup_expired_rate_limit_buckets()
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  DELETE FROM public.rate_limit_buckets WHERE expires_at < now();
$$;--> statement-breakpoint
REVOKE ALL ON FUNCTION public.cleanup_expired_rate_limit_buckets() FROM PUBLIC, anon, authenticated, service_role;--> statement-breakpoint
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'relay-rate-limit-cleanup') THEN
    PERFORM cron.schedule(
      'relay-rate-limit-cleanup',
      '17 * * * *',
      'SELECT public.cleanup_expired_rate_limit_buckets()'
    );
  END IF;
END
$$;
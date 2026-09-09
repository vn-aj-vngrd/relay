-- Serialize legacy writes with the backfill inside Drizzle's migration transaction.
-- Fail rather than leave requests waiting indefinitely on a busy environment.
SET LOCAL lock_timeout = '10s';
SET LOCAL statement_timeout = '120s';
LOCK TABLE public.users, public.sessions, public.messages, public.memories, public.memory_media IN SHARE ROW EXCLUSIVE MODE;
--> statement-breakpoint
CREATE TABLE "billing_game_usage" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"request_key" uuid NOT NULL,
	"session_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "billing_creation_request_unique" UNIQUE("user_id","request_key")
);
--> statement-breakpoint
CREATE TABLE "billing_media" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"host_id" uuid NOT NULL,
	"session_id" uuid NOT NULL,
	"actor_key" text NOT NULL,
	"kind" text NOT NULL,
	"bucket" text NOT NULL,
	"path" text NOT NULL,
	"bytes" bigint NOT NULL,
	"status" text DEFAULT 'reserved' NOT NULL,
	"stored_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "billing_media_path_unique" UNIQUE("path"),
	CONSTRAINT "billing_media_bytes_valid" CHECK ("billing_media"."bytes" > 0)
);
--> statement-breakpoint
CREATE TABLE "billing_methods" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"provider" text NOT NULL,
	"recipient" text NOT NULL,
	"account" text NOT NULL,
	"instructions" text NOT NULL,
	"qr_path" text,
	"enabled" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "billing_overrides" (
	"user_id" uuid PRIMARY KEY NOT NULL,
	"games" integer,
	"storage_bytes" bigint,
	"expires_at" timestamp with time zone,
	"reason" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "billing_requests" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"method_id" uuid NOT NULL,
	"snapshot" jsonb NOT NULL,
	"plan_version" text NOT NULL,
	"amount_cents" integer NOT NULL,
	"games" integer NOT NULL,
	"storage_bytes" bigint NOT NULL,
	"status" text DEFAULT 'awaiting_payment' NOT NULL,
	"transaction_reference" text,
	"verified_transaction_key" text,
	"proof_path" text,
	"review_note" text,
	"reviewed_by" uuid,
	"reviewed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "billing_settings" (
	"id" text PRIMARY KEY DEFAULT 'global' NOT NULL,
	"accepting_payments" boolean DEFAULT false NOT NULL,
	"support_contact" text DEFAULT '' NOT NULL,
	"review_time" text DEFAULT '' NOT NULL,
	"policy" text DEFAULT '' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "billing_terms" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"request_id" uuid,
	"source" text NOT NULL,
	"plan_version" text NOT NULL,
	"starts_at" timestamp with time zone NOT NULL,
	"ends_at" timestamp with time zone NOT NULL,
	"usage_starts_at" timestamp with time zone NOT NULL,
	"games" integer NOT NULL,
	"storage_bytes" bigint NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "billing_terms_request_id_unique" UNIQUE("request_id"),
	CONSTRAINT "billing_term_dates_valid" CHECK ("billing_terms"."ends_at" > "billing_terms"."starts_at" and "billing_terms"."usage_starts_at" <= "billing_terms"."starts_at")
);
--> statement-breakpoint
ALTER TABLE "sessions" ADD COLUMN "participant_images_enabled" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "billing_game_usage" ADD CONSTRAINT "billing_game_usage_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "billing_media" ADD CONSTRAINT "billing_media_host_id_users_id_fk" FOREIGN KEY ("host_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "billing_overrides" ADD CONSTRAINT "billing_overrides_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "billing_requests" ADD CONSTRAINT "billing_requests_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "billing_requests" ADD CONSTRAINT "billing_requests_method_id_billing_methods_id_fk" FOREIGN KEY ("method_id") REFERENCES "public"."billing_methods"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "billing_requests" ADD CONSTRAINT "billing_requests_reviewed_by_users_id_fk" FOREIGN KEY ("reviewed_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "billing_terms" ADD CONSTRAINT "billing_terms_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "billing_terms" ADD CONSTRAINT "billing_terms_request_id_billing_requests_id_fk" FOREIGN KEY ("request_id") REFERENCES "public"."billing_requests"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "billing_game_usage_user_date_idx" ON "billing_game_usage" USING btree ("user_id","created_at");--> statement-breakpoint
CREATE INDEX "billing_media_host_idx" ON "billing_media" USING btree ("host_id");--> statement-breakpoint
CREATE INDEX "billing_media_actor_date_idx" ON "billing_media" USING btree ("actor_key","created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "billing_verified_transaction_unique" ON "billing_requests" USING btree ("verified_transaction_key");--> statement-breakpoint
CREATE UNIQUE INDEX "billing_one_open_request" ON "billing_requests" USING btree ("user_id") WHERE "billing_requests"."status" in ('awaiting_payment', 'submitted', 'clarification');--> statement-breakpoint
CREATE INDEX "billing_requests_created_idx" ON "billing_requests" USING btree ("created_at","id");--> statement-breakpoint
CREATE INDEX "billing_terms_user_period_idx" ON "billing_terms" USING btree ("user_id","starts_at","ends_at");
--> statement-breakpoint
ALTER TABLE public.billing_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.billing_methods ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.billing_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.billing_terms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.billing_overrides ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.billing_game_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.billing_media ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.billing_settings, public.billing_methods, public.billing_requests,
  public.billing_terms, public.billing_overrides, public.billing_game_usage, public.billing_media
  FROM anon, authenticated, service_role;
--> statement-breakpoint
INSERT INTO public.billing_settings (id, accepting_payments) VALUES ('global', false);
--> statement-breakpoint
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('subscription-files', 'subscription-files', false, 5242880, ARRAY['image/jpeg', 'image/png', 'image/webp'])
ON CONFLICT (id) DO UPDATE SET public = false, file_size_limit = EXCLUDED.file_size_limit, allowed_mime_types = EXCLUDED.allowed_mime_types;
--> statement-breakpoint
-- Retain existing games in the usage ledger, including drafts and cancelled games.
INSERT INTO public.billing_game_usage (user_id, request_key, session_id, created_at)
SELECT host_id, id, id, created_at FROM public.sessions;
--> statement-breakpoint
-- Existing beta accounts receive one month of complimentary Pro. No payment is fabricated.
INSERT INTO public.billing_terms (user_id, source, plan_version, starts_at, ends_at, usage_starts_at, games, storage_bytes)
SELECT id, 'complimentary', 'pro-v1', now(),
  ((now() AT TIME ZONE 'Asia/Manila') + interval '1 month') AT TIME ZONE 'Asia/Manila',
  date_trunc('month', now() AT TIME ZONE 'Asia/Manila') AT TIME ZONE 'Asia/Manila', 30, 2147483648
FROM public.users;
--> statement-breakpoint
-- Account for legacy media from authoritative object metadata; do not fetch private files.
-- Missing object sizes conservatively reserve the historical upload ceiling.
INSERT INTO public.billing_media (host_id, session_id, actor_key, kind, bucket, path, bytes, status, stored_at, created_at)
SELECT s.host_id, s.id, coalesce('user:' || m.author_id::text, 'guest:' || m.session_player_id::text, 'legacy:' || m.id::text),
  'chat', 'chat-images', m.image_path,
  greatest(1, coalesce((o.metadata->>'size')::bigint, 8388608)), 'stored', m.created_at, m.created_at
FROM public.messages m JOIN public.sessions s ON s.id = m.session_id
LEFT JOIN storage.objects o ON o.bucket_id = 'chat-images' AND o.name = m.image_path
WHERE m.image_path IS NOT NULL
ON CONFLICT (path) DO NOTHING;
--> statement-breakpoint
INSERT INTO public.billing_media (host_id, session_id, actor_key, kind, bucket, path, bytes, status, stored_at, created_at)
SELECT s.host_id, s.id, coalesce('user:' || mm.uploader_id::text, 'legacy:' || mm.id::text),
  'memory', 'session-memories', mm.storage_path,
  greatest(1, coalesce((o.metadata->>'size')::bigint, 26214400)), 'stored', mm.created_at, mm.created_at
FROM public.memory_media mm JOIN public.memories m ON m.id = mm.memory_id
JOIN public.sessions s ON s.id = m.session_id
LEFT JOIN storage.objects o ON o.bucket_id = 'session-memories' AND o.name = mm.storage_path
ON CONFLICT (path) DO NOTHING;
--> statement-breakpoint
CREATE OR REPLACE FUNCTION public.create_subscription_reminders()
RETURNS void LANGUAGE sql SECURITY DEFINER SET search_path = '' AS $$
  INSERT INTO public.notifications (user_id, type, payload, dedupe_key)
  SELECT t.user_id, 'subscription_renewal', '{}'::jsonb, 'subscription-renewal:' || t.id::text
  FROM public.billing_terms t
  WHERE t.ends_at > now() AND t.ends_at <= now() + interval '3 days'
    AND NOT EXISTS (SELECT 1 FROM public.billing_terms later WHERE later.user_id = t.user_id AND later.ends_at > t.ends_at)
  ON CONFLICT (dedupe_key) DO NOTHING;
$$;
REVOKE ALL ON FUNCTION public.create_subscription_reminders() FROM PUBLIC, anon, authenticated, service_role;
--> statement-breakpoint
SELECT cron.schedule('relay-subscription-reminders', '0 * * * *', 'SELECT public.create_subscription_reminders()');
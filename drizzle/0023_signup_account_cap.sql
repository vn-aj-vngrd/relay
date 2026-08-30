CREATE TABLE "signup_settings" (
	"id" text PRIMARY KEY DEFAULT 'global' NOT NULL,
	"account_cap" integer DEFAULT 200 NOT NULL,
	"updated_by_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "signup_settings_singleton" CHECK ("signup_settings"."id" = 'global'),
	CONSTRAINT "signup_account_cap_valid" CHECK ("signup_settings"."account_cap" between 1 and 50000)
);
--> statement-breakpoint
ALTER TABLE "signup_settings" ADD CONSTRAINT "signup_settings_updated_by_id_users_id_fk" FOREIGN KEY ("updated_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
--> statement-breakpoint
INSERT INTO public.signup_settings (id, account_cap)
VALUES ('global', 200)
ON CONFLICT (id) DO NOTHING;
--> statement-breakpoint
ALTER TABLE public.signup_settings ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
REVOKE ALL ON TABLE public.signup_settings FROM anon, authenticated, service_role;
--> statement-breakpoint
GRANT USAGE ON SCHEMA public TO supabase_auth_admin;
--> statement-breakpoint
GRANT SELECT ON TABLE public.signup_settings TO supabase_auth_admin;
--> statement-breakpoint
CREATE POLICY "Auth reads signup settings"
ON public.signup_settings FOR SELECT TO supabase_auth_admin
USING (id = 'global');
--> statement-breakpoint
CREATE OR REPLACE FUNCTION public.hook_enforce_signup_account_cap(event jsonb)
RETURNS jsonb
LANGUAGE plpgsql
SET search_path = ''
AS $$
DECLARE
  configured_cap integer;
  account_count bigint;
BEGIN
  -- Serialize the capacity check with the auth.users insert transaction so a
  -- burst of concurrent signups cannot all claim the final available place.
  PERFORM pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended('relay.signup-account-cap', 0));

  SELECT account_cap
  INTO STRICT configured_cap
  FROM public.signup_settings
  WHERE id = 'global';

  SELECT count(*)
  INTO account_count
  FROM auth.users;

  IF account_count >= configured_cap THEN
    RETURN jsonb_build_object(
      'error', jsonb_build_object(
        'http_code', 403,
        'message', 'Relay beta signup is full right now.'
      )
    );
  END IF;

  RETURN '{}'::jsonb;
EXCEPTION
  WHEN no_data_found THEN
    RETURN jsonb_build_object(
      'error', jsonb_build_object(
        'http_code', 503,
        'message', 'Relay signup is temporarily unavailable.'
      )
    );
  WHEN OTHERS THEN
    RETURN jsonb_build_object(
      'error', jsonb_build_object(
        'http_code', 503,
        'message', 'Relay signup is temporarily unavailable.'
      )
    );
END;
$$;
--> statement-breakpoint
GRANT EXECUTE ON FUNCTION public.hook_enforce_signup_account_cap(jsonb) TO supabase_auth_admin;
--> statement-breakpoint
REVOKE EXECUTE ON FUNCTION public.hook_enforce_signup_account_cap(jsonb) FROM PUBLIC, anon, authenticated, service_role;
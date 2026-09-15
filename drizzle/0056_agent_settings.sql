CREATE TABLE "agent_settings" (
	"id" text PRIMARY KEY DEFAULT 'global' NOT NULL,
	"enabled" boolean DEFAULT false NOT NULL,
	"encrypted_api_key" text,
	"model" text DEFAULT '' NOT NULL,
	"instructions" text DEFAULT '' NOT NULL,
	"allow_game_data" boolean DEFAULT true NOT NULL,
	"allow_help" boolean DEFAULT true NOT NULL,
	"max_output_tokens" integer DEFAULT 1200 NOT NULL,
	"requests_per_hour" integer DEFAULT 30 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "agent_settings_singleton" CHECK ("agent_settings"."id" = 'global')
);
--> statement-breakpoint
ALTER TABLE "agent_settings" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
REVOKE ALL ON TABLE "agent_settings" FROM anon, authenticated, service_role;

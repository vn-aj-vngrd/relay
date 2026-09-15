CREATE TABLE "agent_message_usage" (
	"id" uuid PRIMARY KEY NOT NULL,
	"user_id" uuid NOT NULL,
	"status" text DEFAULT 'reserved' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	CONSTRAINT "agent_message_usage_status" CHECK ("agent_message_usage"."status" in ('reserved', 'charged', 'released'))
);
--> statement-breakpoint
ALTER TABLE "agent_message_usage" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "agent_settings" ADD COLUMN "free_messages" integer DEFAULT 50 NOT NULL;--> statement-breakpoint
ALTER TABLE "agent_settings" ADD COLUMN "plus_messages" integer DEFAULT 250 NOT NULL;--> statement-breakpoint
ALTER TABLE "agent_settings" ADD COLUMN "pro_messages" integer DEFAULT 750 NOT NULL;--> statement-breakpoint
ALTER TABLE "agent_message_usage" ADD CONSTRAINT "agent_message_usage_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "agent_message_usage_user_date_idx" ON "agent_message_usage" USING btree ("user_id","created_at");
--> statement-breakpoint
REVOKE ALL ON TABLE "agent_message_usage" FROM anon, authenticated, service_role;

CREATE TABLE "agent_conversations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"title" text NOT NULL,
	"messages" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"active_request_id" uuid,
	"active_until" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "agent_conversation_title_length" CHECK (char_length("agent_conversations"."title") between 1 and 100),
	CONSTRAINT "agent_conversation_message_limit" CHECK (jsonb_array_length("agent_conversations"."messages") <= 100)
);
--> statement-breakpoint
ALTER TABLE "agent_conversations" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "agent_conversations" ADD CONSTRAINT "agent_conversations_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "agent_conversations_owner_updated_idx" ON "agent_conversations" USING btree ("user_id","updated_at","id");
--> statement-breakpoint
REVOKE ALL ON TABLE "agent_conversations" FROM anon, authenticated;

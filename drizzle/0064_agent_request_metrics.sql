CREATE TABLE "agent_request_metrics" (
	"id" uuid PRIMARY KEY NOT NULL,
	"status" text NOT NULL,
	"error_kind" text,
	"duration_ms" integer NOT NULL,
	"first_text_ms" integer,
	"tool_calls" integer NOT NULL,
	"tool_failures" integer NOT NULL,
	"input_tokens" integer,
	"output_tokens" integer,
	"cost_usd_micros" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "agent_request_metrics_status" CHECK ("agent_request_metrics"."status" in ('completed', 'failed', 'stopped'))
);
--> statement-breakpoint
ALTER TABLE "agent_request_metrics" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE INDEX "agent_request_metrics_date_idx" ON "agent_request_metrics" USING btree ("created_at");
--> statement-breakpoint
REVOKE ALL ON TABLE "agent_request_metrics" FROM PUBLIC, anon, authenticated, service_role;

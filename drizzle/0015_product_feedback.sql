CREATE TYPE "public"."feedback_status" AS ENUM('new', 'reviewing', 'planned', 'resolved', 'closed');--> statement-breakpoint
CREATE TYPE "public"."feedback_type" AS ENUM('bug', 'feature', 'general');--> statement-breakpoint
CREATE TABLE "feedback_submissions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"type" "feedback_type" NOT NULL,
	"status" "feedback_status" DEFAULT 'new' NOT NULL,
	"area" text DEFAULT 'general' NOT NULL,
	"title" text NOT NULL,
	"description" text NOT NULL,
	"page_path" text,
	"contact_allowed" boolean DEFAULT true NOT NULL,
	"admin_note" text,
	"reviewed_by_id" uuid,
	"reviewed_at" timestamp with time zone,
	"resolved_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "feedback_submissions" ADD CONSTRAINT "feedback_submissions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "feedback_submissions" ADD CONSTRAINT "feedback_submissions_reviewed_by_id_users_id_fk" FOREIGN KEY ("reviewed_by_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "feedback_status_created_idx" ON "feedback_submissions" USING btree ("status","created_at");--> statement-breakpoint
CREATE INDEX "feedback_type_created_idx" ON "feedback_submissions" USING btree ("type","created_at");--> statement-breakpoint
CREATE INDEX "feedback_user_created_idx" ON "feedback_submissions" USING btree ("user_id","created_at");--> statement-breakpoint
ALTER TABLE "feedback_submissions" ENABLE ROW LEVEL SECURITY;
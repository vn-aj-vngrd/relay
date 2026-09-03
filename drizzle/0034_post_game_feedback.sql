ALTER TABLE "feedback_submissions" ADD COLUMN "session_id" uuid;--> statement-breakpoint
ALTER TABLE "feedback_submissions" ADD COLUMN "experience" text;--> statement-breakpoint
ALTER TABLE "feedback_submissions" ADD CONSTRAINT "feedback_submissions_session_id_sessions_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."sessions"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "feedback_submissions" ADD CONSTRAINT "feedback_user_session_unique" UNIQUE("user_id","session_id");--> statement-breakpoint
ALTER TABLE "feedback_submissions" ADD CONSTRAINT "feedback_experience_valid" CHECK ("feedback_submissions"."experience" is null or "feedback_submissions"."experience" in ('smooth', 'issues'));
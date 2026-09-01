UPDATE "sessions"
SET "visibility" = 'link', "updated_at" = now(), "version" = "version" + 1
WHERE "visibility" = 'public' AND "estimated_cost_cents" IS NULL;
--> statement-breakpoint
ALTER TABLE "sessions" ADD CONSTRAINT "session_public_cost_required" CHECK ("sessions"."visibility" <> 'public' or "sessions"."estimated_cost_cents" is not null);
--> statement-breakpoint
CREATE INDEX "sessions_public_discovery_idx" ON "sessions" USING btree ("visibility","status","ends_at","starts_at","id");
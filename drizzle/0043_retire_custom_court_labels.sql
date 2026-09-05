-- Normalize future assignment names without rewriting match snapshots.
UPDATE "courts"
SET "label" = 'Court ' || "position"::text
WHERE "label" IS DISTINCT FROM 'Court ' || "position"::text;
--> statement-breakpoint
ALTER TABLE "sessions" DROP COLUMN "court_numbers";
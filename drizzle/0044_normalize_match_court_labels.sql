-- Remove retired custom labels from courts and every match snapshot.
-- IDs, assignments, scores, versions, and timestamps remain unchanged.
UPDATE "courts"
SET "label" = 'Court ' || "position"::text
WHERE "label" IS DISTINCT FROM 'Court ' || "position"::text;
--> statement-breakpoint
UPDATE "matches" AS m
SET "court_label" = 'Court ' || c."position"::text
FROM "courts" AS c
WHERE m."court_id" = c."id"
  AND m."court_label" IS DISTINCT FROM 'Court ' || c."position"::text;
--> statement-breakpoint
-- Deleted courts have no trustworthy position; do not invent one.
UPDATE "matches"
SET "court_label" = 'Court'
WHERE "court_id" IS NULL
  AND "court_label" IS DISTINCT FROM 'Court';

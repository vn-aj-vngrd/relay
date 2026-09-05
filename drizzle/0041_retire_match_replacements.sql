DELETE FROM "notifications" WHERE "type" = 'replacement_requested';--> statement-breakpoint
DELETE FROM "messages"
WHERE "kind" = 'system'
  AND (
    "body" LIKE 'A player requested a replacement on %.'
    OR "body" LIKE '% players were replaced before scoring began.'
  );--> statement-breakpoint
ALTER TABLE "matches" DROP CONSTRAINT "matches_replacement_requested_by_id_session_players_id_fk";
--> statement-breakpoint
ALTER TABLE "matches" DROP COLUMN "replacement_requested_by_id";--> statement-breakpoint
ALTER TABLE "matches" DROP COLUMN "replacement_requested_at";
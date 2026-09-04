ALTER TABLE "sessions" RENAME COLUMN "estimated_cost_cents" TO "player_price_cents";--> statement-breakpoint
UPDATE "sessions" SET "player_price_cents" = NULL WHERE "player_price_cents" > 0;--> statement-breakpoint
WITH "player_totals" AS (
  SELECT
    "expenses"."session_id",
    "player_payments"."session_player_id",
    SUM("player_payments"."amount_cents")::bigint AS "total_cents"
  FROM "player_payments"
  INNER JOIN "expenses"
    ON "expenses"."id" = "player_payments"."expense_id"
  WHERE "player_payments"."status" <> 'excluded'
  GROUP BY
    "expenses"."session_id",
    "player_payments"."session_player_id"
),
"session_prices" AS (
  SELECT
    "session_id",
    MAX("total_cents")::integer AS "player_price_cents"
  FROM "player_totals"
  GROUP BY "session_id"
  HAVING MAX("total_cents") > 0
)
UPDATE "sessions"
SET "player_price_cents" = "session_prices"."player_price_cents"
FROM "session_prices"
WHERE "sessions"."id" = "session_prices"."session_id";

CREATE TYPE "public"."venue_price_status" AS ENUM('unknown', 'free', 'paid', 'contact', 'donation', 'members', 'invitation');--> statement-breakpoint
ALTER TABLE "venues" DROP CONSTRAINT "venues_price_complete";--> statement-breakpoint
ALTER TABLE "venues" ADD COLUMN "price_status" "venue_price_status" DEFAULT 'unknown' NOT NULL;--> statement-breakpoint
ALTER TABLE "venues" ADD COLUMN "price_max_cents" integer;--> statement-breakpoint
WITH parsed AS (
  SELECT
    "id",
    lower(trim("price_range")) AS "raw_price",
    coalesce(
      regexp_match("price_range", '(?i)(?:₱|p\s*)([0-9][0-9,]*(?:\.[0-9]+)?)(?:\s*(?:-|–|to)\s*(?:₱|p\s*)?([0-9][0-9,]*(?:\.[0-9]+)?))?'),
      regexp_match("price_range", '^\s*([0-9][0-9,]*(?:\.[0-9]+)?)(?:\s*(?:-|–|to)\s*([0-9][0-9,]*(?:\.[0-9]+)?))?')
    ) AS "amounts"
  FROM "venues"
)
UPDATE "venues" AS venue
SET
  "price_status" = CASE
    WHEN venue."price_amount_cents" IS NOT NULL THEN 'paid'::"venue_price_status"
    WHEN parsed."raw_price" ~ 'free' THEN 'free'::"venue_price_status"
    WHEN parsed."raw_price" ~ 'donation' THEN 'donation'::"venue_price_status"
    WHEN parsed."raw_price" ~ 'call' THEN 'contact'::"venue_price_status"
    WHEN parsed."amounts" IS NOT NULL THEN 'paid'::"venue_price_status"
    WHEN parsed."raw_price" ~ 'member' THEN 'members'::"venue_price_status"
    WHEN parsed."raw_price" ~ 'invitation' THEN 'invitation'::"venue_price_status"
    ELSE 'unknown'::"venue_price_status"
  END,
  "price_amount_cents" = CASE
    WHEN venue."price_amount_cents" IS NOT NULL THEN venue."price_amount_cents"
    WHEN parsed."raw_price" ~ 'free' THEN 0
    WHEN parsed."amounts" IS NOT NULL THEN round(replace(parsed."amounts"[1], ',', '')::numeric * 100)::integer
    ELSE NULL
  END,
  "price_max_cents" = CASE
    WHEN parsed."amounts"[2] IS NOT NULL THEN round(replace(parsed."amounts"[2], ',', '')::numeric * 100)::integer
    ELSE NULL
  END,
  "price_unit" = CASE
    WHEN venue."price_unit" IS NOT NULL THEN venue."price_unit"
    WHEN parsed."amounts" IS NULL OR parsed."raw_price" ~ 'free' THEN NULL
    WHEN parsed."raw_price" ~ '(player|person|sharing)' THEN 'player'::"venue_price_unit"
    WHEN parsed."raw_price" ~ 'court' AND parsed."raw_price" ~ '(hour|/hr)' THEN 'court_hour'::"venue_price_unit"
    WHEN parsed."raw_price" ~ '(hour|/hr|[0-9]+\s*hours)' THEN 'hour'::"venue_price_unit"
    WHEN parsed."raw_price" ~ '(game|session)' THEN 'session'::"venue_price_unit"
    ELSE 'player'::"venue_price_unit"
  END
FROM parsed
WHERE venue."id" = parsed."id";--> statement-breakpoint
ALTER TABLE "venues" DROP COLUMN "price_range";--> statement-breakpoint
ALTER TABLE "venues" DROP COLUMN "parking";--> statement-breakpoint
ALTER TABLE "venues" ADD CONSTRAINT "venues_price_max_valid" CHECK ("venues"."price_max_cents" is null or ("venues"."price_amount_cents" is not null and "venues"."price_max_cents" >= "venues"."price_amount_cents"));--> statement-breakpoint
ALTER TABLE "venues" ADD CONSTRAINT "venues_price_complete" CHECK (("venues"."price_status" = 'paid' and "venues"."price_amount_cents" is not null and "venues"."price_unit" is not null) or ("venues"."price_status" = 'free' and "venues"."price_amount_cents" = 0 and "venues"."price_unit" is null and "venues"."price_max_cents" is null) or ("venues"."price_status" not in ('paid', 'free') and "venues"."price_amount_cents" is null and "venues"."price_unit" is null and "venues"."price_max_cents" is null));
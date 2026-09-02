CREATE TYPE "public"."venue_parking_status" AS ENUM('available', 'limited', 'none');--> statement-breakpoint
CREATE TYPE "public"."venue_price_unit" AS ENUM('hour', 'player', 'court', 'session', 'court_hour', 'player_session');--> statement-breakpoint
ALTER TABLE "venues" ADD COLUMN "price_amount_cents" integer;--> statement-breakpoint
ALTER TABLE "venues" ADD COLUMN "price_unit" "venue_price_unit";--> statement-breakpoint
ALTER TABLE "venues" ADD COLUMN "parking_status" "venue_parking_status";--> statement-breakpoint
UPDATE "venues"
SET "parking_status" = CASE
  WHEN lower(trim("parking")) IN ('none', 'not available', 'unavailable', 'no parking') THEN 'none'::"venue_parking_status"
  WHEN lower(trim("parking")) LIKE '%limited%' THEN 'limited'::"venue_parking_status"
  ELSE 'available'::"venue_parking_status"
END
WHERE "parking" IS NOT NULL AND trim("parking") <> '';--> statement-breakpoint
ALTER TABLE "venues" ADD CONSTRAINT "venues_price_amount_nonnegative" CHECK ("venues"."price_amount_cents" is null or "venues"."price_amount_cents" >= 0);--> statement-breakpoint
ALTER TABLE "venues" ADD CONSTRAINT "venues_price_complete" CHECK (("venues"."price_amount_cents" is null and "venues"."price_unit" is null) or ("venues"."price_amount_cents" is not null and "venues"."price_unit" is not null));
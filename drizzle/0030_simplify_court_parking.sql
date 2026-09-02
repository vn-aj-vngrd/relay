ALTER TABLE "venues" ALTER COLUMN "parking_status" SET DATA TYPE text;--> statement-breakpoint
UPDATE "venues"
SET "parking_status" = CASE
  WHEN "parking_status" = 'limited' THEN 'available'
  WHEN "parking_status" = 'none' THEN 'unavailable'
  ELSE "parking_status"
END
WHERE "parking_status" IN ('limited', 'none');--> statement-breakpoint
DROP TYPE "public"."venue_parking_status";--> statement-breakpoint
CREATE TYPE "public"."venue_parking_status" AS ENUM('available', 'unavailable');--> statement-breakpoint
ALTER TABLE "venues" ALTER COLUMN "parking_status" SET DATA TYPE "public"."venue_parking_status" USING "parking_status"::"public"."venue_parking_status";
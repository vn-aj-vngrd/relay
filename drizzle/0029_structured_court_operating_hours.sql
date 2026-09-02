CREATE TABLE "venue_operating_periods" (
	"venue_id" uuid NOT NULL,
	"day_of_week" integer NOT NULL,
	"sequence" integer DEFAULT 0 NOT NULL,
	"opens_at" time(0) NOT NULL,
	"closes_at" time(0) NOT NULL,
	CONSTRAINT "venue_operating_periods_venue_id_day_of_week_sequence_pk" PRIMARY KEY("venue_id","day_of_week","sequence"),
	CONSTRAINT "venue_operating_periods_day_valid" CHECK ("venue_operating_periods"."day_of_week" between 1 and 7),
	CONSTRAINT "venue_operating_periods_sequence_nonnegative" CHECK ("venue_operating_periods"."sequence" >= 0)
);
--> statement-breakpoint
ALTER TABLE "venue_operating_periods" ADD CONSTRAINT "venue_operating_periods_venue_id_venues_id_fk" FOREIGN KEY ("venue_id") REFERENCES "public"."venues"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "venue_operating_periods_venue_day_idx" ON "venue_operating_periods" USING btree ("venue_id","day_of_week");--> statement-breakpoint
CREATE FUNCTION pg_temp.relay_parse_venue_time(value text) RETURNS time
LANGUAGE plpgsql IMMUTABLE AS $$
DECLARE
  cleaned text := lower(regexp_replace(trim(value), '\s+', '', 'g'));
  clock_value text;
  hour_value integer;
  minute_value integer := 0;
BEGIN
  IF cleaned ~ '(midnight|mn)$' THEN RETURN '00:00'::time; END IF;
  IF cleaned ~ 'nn$' THEN RETURN '12:00'::time; END IF;

  clock_value := regexp_replace(cleaned, '(a\.?m?\.?|p\.?m?\.?)$', '');
  IF position(':' in clock_value) > 0 THEN
    hour_value := split_part(clock_value, ':', 1)::integer;
    minute_value := split_part(clock_value, ':', 2)::integer;
  ELSIF length(clock_value) <= 2 THEN
    hour_value := clock_value::integer;
  ELSIF length(clock_value) = 3 THEN
    hour_value := left(clock_value, 1)::integer;
    minute_value := right(clock_value, 2)::integer;
  ELSE
    hour_value := left(clock_value, 2)::integer;
    minute_value := right(clock_value, 2)::integer;
  END IF;

  IF cleaned ~ 'p\.?m?\.?$' AND hour_value < 12 THEN hour_value := hour_value + 12; END IF;
  IF cleaned ~ 'a\.?m?\.?$' AND hour_value = 12 THEN hour_value := 0; END IF;
  IF hour_value NOT BETWEEN 0 AND 23 OR minute_value NOT BETWEEN 0 AND 59 THEN RETURN NULL; END IF;
  RETURN make_time(hour_value, minute_value, 0);
EXCEPTION WHEN invalid_text_representation THEN
  RETURN NULL;
END;
$$;--> statement-breakpoint
INSERT INTO "venue_operating_periods" ("venue_id", "day_of_week", "opens_at", "closes_at")
SELECT venue.id, day.day_of_week, schedule.opens_at::time, schedule.closes_at::time
FROM "venues" venue
CROSS JOIN LATERAL (
  VALUES
    (1, venue.hours->>'weekdayOpen', venue.hours->>'weekdayClose'),
    (2, venue.hours->>'weekdayOpen', venue.hours->>'weekdayClose'),
    (3, venue.hours->>'weekdayOpen', venue.hours->>'weekdayClose'),
    (4, venue.hours->>'weekdayOpen', venue.hours->>'weekdayClose'),
    (5, venue.hours->>'weekdayOpen', venue.hours->>'weekdayClose'),
    (6, venue.hours->>'weekendOpen', venue.hours->>'weekendClose'),
    (7, venue.hours->>'weekendOpen', venue.hours->>'weekendClose')
) AS day(day_of_week, opens_at, closes_at)
CROSS JOIN LATERAL (SELECT day.opens_at, day.closes_at) schedule
WHERE schedule.opens_at ~ '^([01][0-9]|2[0-3]):[0-5][0-9]$'
  AND schedule.closes_at ~ '^([01][0-9]|2[0-3]):[0-5][0-9]$';--> statement-breakpoint
INSERT INTO "venue_operating_periods" ("venue_id", "day_of_week", "opens_at", "closes_at")
SELECT venue.id, day_of_week, '00:00'::time, '00:00'::time
FROM "venues" venue
CROSS JOIN generate_series(1, 7) day_of_week
WHERE lower(coalesce(venue.hours->>'summary', '')) ~ '^(open )?24 hours$|^anytime$'
ON CONFLICT DO NOTHING;--> statement-breakpoint
WITH legacy AS (
  SELECT id, trim(hours->>'summary') AS summary
  FROM "venues"
  WHERE hours ? 'summary'
), matches AS (
  SELECT legacy.id, legacy.summary, match[1] AS opens_at, match[2] AS closes_at
  FROM legacy
  CROSS JOIN LATERAL regexp_matches(
    legacy.summary,
    '([0-9]{1,2}(?::?[0-9]{2})?\s*(?:a\.?m?\.?|p\.?m?\.?|nn|mn|midnight))\s*(?:-|–|to)\s*([0-9]{1,2}(?::?[0-9]{2})?\s*(?:a\.?m?\.?|p\.?m?\.?|nn|mn|midnight))',
    'gi'
  ) match
  WHERE lower(legacy.summary) ~ '(^daily|^open daily|^monday to sunday|^[0-9])'
), single_ranges AS (
  SELECT id, min(opens_at) AS opens_at, min(closes_at) AS closes_at
  FROM matches
  GROUP BY id
  HAVING count(*) = 1
), parsed AS (
  SELECT id, pg_temp.relay_parse_venue_time(opens_at) AS opens_at, pg_temp.relay_parse_venue_time(closes_at) AS closes_at
  FROM single_ranges
)
INSERT INTO "venue_operating_periods" ("venue_id", "day_of_week", "opens_at", "closes_at")
SELECT parsed.id, day_of_week, parsed.opens_at, parsed.closes_at
FROM parsed
CROSS JOIN generate_series(1, 7) day_of_week
WHERE parsed.opens_at IS NOT NULL AND parsed.closes_at IS NOT NULL
ON CONFLICT DO NOTHING;--> statement-breakpoint
ALTER TABLE "venues" DROP COLUMN "hours";
import { readFile } from "node:fs/promises";

import postgres from "postgres";
import { z } from "zod";

const courtSchema = z.object({
  sourceExternalId: z.string().min(1),
  slug: z.string().min(1),
  name: z.string().min(2),
  address: z.string().min(4),
  latitude: z.number().min(4.45).max(21.35).nullable(),
  longitude: z.number().min(116.8).max(126.7).nullable(),
  environment: z.enum(["indoor", "outdoor", "covered"]).nullable(),
  courtCount: z.number().int().positive().nullable(),
  accessType: z
    .enum([
      "unknown",
      "public",
      "commercial",
      "members",
      "residents",
      "school_or_community",
      "invitation",
    ])
    .default("unknown"),
  reservationPolicy: z
    .enum([
      "unknown",
      "walk_in",
      "reservation_required",
      "walk_in_or_reserve",
      "contact",
    ])
    .default("unknown"),
  operationalStatus: z
    .enum([
      "unknown",
      "operating",
      "temporarily_closed",
      "seasonal",
      "opening_soon",
      "permanently_closed",
    ])
    .default("unknown"),
  operatingHours: z.array(
    z.object({
      dayOfWeek: z.number().int().min(1).max(7),
      sequence: z.number().int().nonnegative(),
      opensAt: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/),
      closesAt: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/),
    })
  ),
  priceStatus: z.enum([
    "unknown",
    "free",
    "paid",
    "contact",
    "donation",
    "members",
    "invitation",
  ]),
  priceAmountCents: z.number().int().nonnegative().nullable(),
  priceMaxCents: z.number().int().nonnegative().nullable(),
  priceUnit: z
    .enum([
      "hour",
      "player",
      "court",
      "session",
      "court_hour",
      "player_session",
    ])
    .nullable(),
  parkingStatus: z.enum(["available", "unavailable"]).nullable(),
  amenities: z.array(z.string()),
  paddleRental: z.boolean(),
  contact: z.string().nullable(),
  websiteUrl: z.url().nullable(),
  socialUrl: z.url().nullable(),
  bookingUrl: z.url().nullable(),
  listingStatus: z.enum(["unverified", "verified"]),
  sourceUrl: z.url(),
  lastSeenAt: z.iso.datetime({ offset: true }),
});

const sourceSchema = z.object({
  source: z.string().min(1),
  sourceUrl: z.url(),
  publishedAt: z.iso.date(),
  records: z.array(courtSchema).min(1),
});

type CourtRecord = z.infer<typeof courtSchema>;
type CourtSource = z.infer<typeof sourceSchema>;
type ExistingCourt = {
  source: string;
  source_external_id: string | null;
  slug: string;
  name: string;
  address: string;
};

const sourceFiles = [
  new URL("../data/courts/sm-active-hub-2026.json", import.meta.url),
  new URL("../data/courts/ppf-places-to-play-2025-09-01.json", import.meta.url),
  new URL("../data/courts/picklepoint-iloilo-2026.json", import.meta.url),
];
const apply = process.argv.includes("--apply");

if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is required.");

function normalize(value: string) {
  return value
    .normalize("NFKD")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function isLikelyDuplicate(
  left: Pick<ExistingCourt, "name">,
  right: CourtRecord
) {
  return normalize(left.name) === normalize(right.name);
}

function verificationNote(source: CourtSource, record: CourtRecord) {
  if (source.source === "smsupermalls.com") {
    return "Verified against the current first-party SM Active Hub court directory on 2026-09-01.";
  }
  if (source.source === "picklepointiloilo.com") {
    return "Verified against the venue-owned website and its structured location, hours, court count, access, and pricing data on 2026-09-03.";
  }
  if (record.listingStatus === "verified") {
    return "Listed by the Philippine Pickleball Federation; the exact coordinate was separately reviewed on 2026-09-01.";
  }
  return "Philippine Pickleball Federation listing retained as a review candidate; current access and exact coordinates still need confirmation.";
}

const sources: CourtSource[] = [];
for (const file of sourceFiles) {
  sources.push(sourceSchema.parse(JSON.parse(await readFile(file, "utf8"))));
}

for (const source of sources) {
  const externalIds = new Set<string>();
  const slugs = new Set<string>();
  for (const record of source.records) {
    if (externalIds.has(record.sourceExternalId))
      throw new Error(`Duplicate source ID: ${record.sourceExternalId}`);
    if (slugs.has(record.slug))
      throw new Error(`Duplicate source slug: ${record.slug}`);
    if ((record.latitude == null) !== (record.longitude == null)) {
      throw new Error(`Incomplete coordinate pair: ${record.name}`);
    }
    if (record.listingStatus === "verified" && record.latitude == null) {
      throw new Error(
        `Verified court has no reviewed coordinate: ${record.name}`
      );
    }
    const paidPricingComplete =
      record.priceStatus === "paid" &&
      record.priceAmountCents != null &&
      record.priceUnit != null;
    const freePricingComplete =
      record.priceStatus === "free" &&
      record.priceAmountCents === 0 &&
      record.priceMaxCents == null &&
      record.priceUnit == null;
    const nonAmountPricingComplete =
      !["paid", "free"].includes(record.priceStatus) &&
      record.priceAmountCents == null &&
      record.priceMaxCents == null &&
      record.priceUnit == null;
    if (
      !paidPricingComplete &&
      !freePricingComplete &&
      !nonAmountPricingComplete
    )
      throw new Error(`Invalid structured pricing: ${record.name}`);
    if (
      record.priceMaxCents != null &&
      (record.priceAmountCents == null ||
        record.priceMaxCents < record.priceAmountCents)
    )
      throw new Error(`Invalid maximum price: ${record.name}`);
    const operatingPeriodKeys = new Set<string>();
    for (const period of record.operatingHours) {
      const key = `${period.dayOfWeek}:${period.sequence}`;
      if (operatingPeriodKeys.has(key))
        throw new Error(`Duplicate operating period: ${record.name} (${key})`);
      operatingPeriodKeys.add(key);
    }
    externalIds.add(record.sourceExternalId);
    slugs.add(record.slug);
  }
}

const sql = postgres(process.env.DATABASE_URL, { prepare: false, max: 1 });
try {
  const existing = await sql<ExistingCourt[]>`
    SELECT source, source_external_id, slug, name, address
    FROM venues
  `;
  const planned: Array<{
    source: CourtSource;
    record: CourtRecord;
    slug: string;
  }> = [];
  const skipped: Array<{ source: string; name: string; duplicate: string }> =
    [];
  const known = [...existing];
  const reservedSlugs = new Set(existing.map((court) => court.slug));

  for (const source of sources) {
    for (const record of source.records) {
      const sameSource = known.find(
        (court) =>
          court.source === source.source &&
          court.source_external_id === record.sourceExternalId
      );
      const duplicate = sameSource
        ? null
        : known.find((court) => isLikelyDuplicate(court, record));
      if (duplicate) {
        skipped.push({
          source: source.source,
          name: record.name,
          duplicate: duplicate.name,
        });
        continue;
      }

      let slug = sameSource?.slug ?? record.slug;
      if (!sameSource && reservedSlugs.has(slug))
        slug = `${slug}-${record.sourceExternalId.slice(-6)}`;
      reservedSlugs.add(slug);
      planned.push({ source, record, slug });
      known.push({
        source: source.source,
        source_external_id: record.sourceExternalId,
        slug,
        name: record.name,
        address: record.address,
      });
    }
  }

  const verified = planned.filter(
    ({ record }) => record.listingStatus === "verified"
  ).length;
  const unverified = planned.length - verified;
  console.log(
    JSON.stringify(
      {
        mode: apply ? "apply" : "dry-run",
        planned: planned.length,
        verified,
        unverified,
        duplicateCandidatesSkipped: skipped.length,
        skipped,
      },
      null,
      2
    )
  );

  if (!apply) {
    console.log("Dry run only. Re-run with --apply after reviewing this plan.");
    process.exitCode = 0;
  } else {
    await sql.begin(async (transaction) => {
      for (const source of sources) {
        const activeIds = source.records.map(
          (record) => record.sourceExternalId
        );
        await transaction`
          UPDATE venues
          SET listing_status = 'archived', updated_at = now()
          WHERE source = ${source.source}
            AND source_external_id IS NOT NULL
            AND NOT (source_external_id = ANY(${transaction.array(activeIds)}))
        `;
      }

      for (const { source, record, slug } of planned) {
        const verifiedAt =
          record.listingStatus === "verified"
            ? new Date("2026-09-01T00:00:00+08:00")
            : null;
        const saved = await transaction<{ id: string }[]>`
          INSERT INTO venues (
            slug, name, address, latitude, longitude, environment, court_count,
            access_type, reservation_policy, operational_status,
            price_status, price_amount_cents, price_max_cents, price_unit, parking_status,
            amenities, paddle_rental, contact, website_url, social_url, booking_url,
            listing_status, source, source_external_id, source_url, verification_note, verified_at, last_seen_at
          ) VALUES (
            ${slug}, ${record.name}, ${record.address}, ${record.latitude}, ${record.longitude},
            ${record.environment}, ${record.courtCount}, ${record.accessType}, ${record.reservationPolicy},
            ${record.operationalStatus}, ${record.priceStatus}, ${record.priceAmountCents},
            ${record.priceMaxCents}, ${record.priceUnit}, ${record.parkingStatus}, ${record.amenities}, ${record.paddleRental},
            ${record.contact}, ${record.websiteUrl},
            ${record.socialUrl}, ${record.bookingUrl}, ${record.listingStatus}, ${source.source},
            ${record.sourceExternalId}, ${record.sourceUrl}, ${verificationNote(source, record)},
            ${verifiedAt}, ${new Date(record.lastSeenAt)}
          )
          ON CONFLICT (source, source_external_id) DO UPDATE SET
            slug = EXCLUDED.slug,
            name = EXCLUDED.name,
            address = EXCLUDED.address,
            latitude = EXCLUDED.latitude,
            longitude = EXCLUDED.longitude,
            environment = EXCLUDED.environment,
            court_count = EXCLUDED.court_count,
            access_type = EXCLUDED.access_type,
            reservation_policy = EXCLUDED.reservation_policy,
            operational_status = EXCLUDED.operational_status,
            price_status = EXCLUDED.price_status,
            price_amount_cents = EXCLUDED.price_amount_cents,
            price_max_cents = EXCLUDED.price_max_cents,
            price_unit = EXCLUDED.price_unit,
            parking_status = EXCLUDED.parking_status,
            amenities = EXCLUDED.amenities,
            paddle_rental = EXCLUDED.paddle_rental,
            contact = EXCLUDED.contact,
            website_url = EXCLUDED.website_url,
            social_url = EXCLUDED.social_url,
            booking_url = EXCLUDED.booking_url,
            listing_status = EXCLUDED.listing_status,
            source_url = EXCLUDED.source_url,
            verification_note = EXCLUDED.verification_note,
            verified_at = EXCLUDED.verified_at,
            last_seen_at = EXCLUDED.last_seen_at,
            updated_at = now()
          RETURNING id
        `;
        const venueId = saved[0]?.id;
        if (!venueId)
          throw new Error(`Failed to save operating hours for ${record.name}.`);
        await transaction`DELETE FROM venue_operating_periods WHERE venue_id = ${venueId}`;
        for (const period of record.operatingHours)
          await transaction`
            INSERT INTO venue_operating_periods (venue_id, day_of_week, sequence, opens_at, closes_at)
            VALUES (${venueId}, ${period.dayOfWeek}, ${period.sequence}, ${period.opensAt}, ${period.closesAt})
          `;
      }
    });
    console.log(
      `Imported ${planned.length} nationwide court records (${verified} verified, ${unverified} pending review).`
    );
  }
} finally {
  await sql.end();
}

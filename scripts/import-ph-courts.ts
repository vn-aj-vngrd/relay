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
  hours: z.object({ summary: z.string().min(1) }).nullable(),
  priceRange: z.string().nullable(),
  parking: z.string().nullable(),
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

function isLikelyDuplicate(left: Pick<ExistingCourt, "name">, right: CourtRecord) {
  return normalize(left.name) === normalize(right.name);
}

function verificationNote(source: CourtSource, record: CourtRecord) {
  if (source.source === "smsupermalls.com") {
    return "Verified against the current first-party SM Active Hub court directory on 2026-09-01.";
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
    if (externalIds.has(record.sourceExternalId)) throw new Error(`Duplicate source ID: ${record.sourceExternalId}`);
    if (slugs.has(record.slug)) throw new Error(`Duplicate source slug: ${record.slug}`);
    if ((record.latitude == null) !== (record.longitude == null)) {
      throw new Error(`Incomplete coordinate pair: ${record.name}`);
    }
    if (record.listingStatus === "verified" && record.latitude == null) {
      throw new Error(`Verified court has no reviewed coordinate: ${record.name}`);
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
  const planned: Array<{ source: CourtSource; record: CourtRecord; slug: string }> = [];
  const skipped: Array<{ source: string; name: string; duplicate: string }> = [];
  const known = [...existing];
  const reservedSlugs = new Set(existing.map((court) => court.slug));

  for (const source of sources) {
    for (const record of source.records) {
      const sameSource = known.find(
        (court) => court.source === source.source && court.source_external_id === record.sourceExternalId,
      );
      const duplicate = sameSource ? null : known.find((court) => isLikelyDuplicate(court, record));
      if (duplicate) {
        skipped.push({ source: source.source, name: record.name, duplicate: duplicate.name });
        continue;
      }

      let slug = sameSource?.slug ?? record.slug;
      if (!sameSource && reservedSlugs.has(slug)) slug = `${slug}-${record.sourceExternalId.slice(-6)}`;
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

  const verified = planned.filter(({ record }) => record.listingStatus === "verified").length;
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
      2,
    ),
  );

  if (!apply) {
    console.log("Dry run only. Re-run with --apply after reviewing this plan.");
    process.exitCode = 0;
  } else {
    await sql.begin(async (transaction) => {
      for (const source of sources) {
        const activeIds = source.records.map((record) => record.sourceExternalId);
        await transaction`
          UPDATE venues
          SET listing_status = 'archived', updated_at = now()
          WHERE source = ${source.source}
            AND source_external_id IS NOT NULL
            AND NOT (source_external_id = ANY(${transaction.array(activeIds)}))
        `;
      }

      for (const { source, record, slug } of planned) {
        const hours = record.hours ? transaction.json(record.hours) : null;
        const verifiedAt = record.listingStatus === "verified" ? new Date("2026-09-01T00:00:00+08:00") : null;
        await transaction`
          INSERT INTO venues (
            slug, name, address, latitude, longitude, environment, court_count, hours, price_range,
            parking, amenities, paddle_rental, contact, website_url, social_url, booking_url,
            listing_status, source, source_external_id, source_url, verification_note, verified_at, last_seen_at
          ) VALUES (
            ${slug}, ${record.name}, ${record.address}, ${record.latitude}, ${record.longitude},
            ${record.environment}, ${record.courtCount}, ${hours}, ${record.priceRange}, ${record.parking},
            ${record.amenities}, ${record.paddleRental}, ${record.contact}, ${record.websiteUrl},
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
            hours = EXCLUDED.hours,
            price_range = EXCLUDED.price_range,
            parking = EXCLUDED.parking,
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
        `;
      }
    });
    console.log(
      `Imported ${planned.length} nationwide court records (${verified} verified, ${unverified} pending review).`,
    );
  }
} finally {
  await sql.end();
}

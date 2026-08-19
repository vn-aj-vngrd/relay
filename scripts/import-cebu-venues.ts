import postgres from "postgres";

const sourceName = "cebupickleballcourts.com";
const sourceEndpoint =
  "https://cebupickleballcourts.com/wp-json/wp/v2/posts?per_page=100&_fields=link,slug,title,content,date,modified";

if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is required.");

type SourcePost = {
  slug: string;
  link: string;
  modified: string;
  title: { rendered: string };
  content: { rendered: string };
};

type VenueImport = {
  source: string;
  slug: string;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  environment: string | null;
  courtCount: number | null;
  hours: { summary: string } | null;
  priceRange: string | null;
  parking: string | null;
  amenities: string[];
  paddleRental: boolean;
  contact: string | null;
  websiteUrl: string | null;
  socialUrl: string | null;
  bookingUrl: string | null;
  sourceUrl: string;
  sourceExternalId: string;
  lastSeenAt: Date;
};

function decodeText(value: string) {
  return value
    .replace(/<br\s*\/?>/gi, " ")
    .replace(/<[^>]*>/g, " ")
    .replaceAll("&amp;", "&")
    .replaceAll("&nbsp;", " ")
    .replaceAll("&#8211;", "–")
    .replaceAll("&ndash;", "–")
    .replaceAll("&#8217;", "'")
    .replaceAll("&rsquo;", "'")
    .replaceAll("&#8369;", "₱")
    .replace(/\s+/g, " ")
    .trim();
}

function field(html: string, label: string) {
  const escaped = label.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const match = html.match(new RegExp(`<strong>${escaped}:<\\/strong>([\\s\\S]*?)<\\/li>`, "i"));
  return match ? decodeText(match[1]) : null;
}

function linkField(html: string, label: string) {
  const escaped = label.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const section = html.match(new RegExp(`<strong>${escaped}:<\\/strong>([\\s\\S]*?)<\\/li>`, "i"))?.[1];
  if (!section) return null;
  const value = section.match(/href="([^"]+)"/i)?.[1]?.replaceAll("&amp;", "&") ?? decodeText(section);
  return /^https?:\/\//i.test(value) ? value : null;
}

function yes(value: string | null) {
  return value?.trim().toLowerCase().startsWith("yes") ?? false;
}

function parsePost(post: SourcePost): VenueImport | null {
  const html = post.content.rendered;
  const name = field(html, "Court Name") ?? decodeText(post.title.rendered);
  const address = field(html, "Address");
  const coordinate = html.match(/!2d(12[0-9.]+)!3d(1[0-2]\.[0-9.]+)/);
  if (!name || !address || !coordinate) return null;

  const longitude = Number(coordinate[1]);
  const latitude = Number(coordinate[2]);
  if (latitude < 9.3 || latitude > 11.3 || longitude < 123.2 || longitude > 124.4) return null;

  const courtCountText = field(html, "Number of Courts");
  const courtCount = courtCountText?.match(/\d+/)?.[0];
  const environment = field(html, "Court Type")?.toLowerCase() ?? null;
  const schedule = field(html, "Schedule");
  const price = field(html, "Price");
  const phone = field(html, "Phone");
  const websiteUrl = linkField(html, "Website");
  const socialUrl = linkField(html, "Facebook");
  const bookingUrl =
    websiteUrl && /(book|playserve|sports360|insta-courts|spot-locker)/i.test(websiteUrl) ? websiteUrl : null;
  const amenities = [
    yes(field(html, "Open Play Availability")) ? "Open play" : null,
    yes(field(html, "Comfort Rooms (CR)")) ? "Comfort room" : null,
  ].filter((value): value is string => Boolean(value));

  return {
    source: sourceName,
    slug: post.slug,
    name,
    address,
    latitude,
    longitude,
    environment,
    courtCount: courtCount ? Number(courtCount) : null,
    hours: schedule ? { summary: schedule } : null,
    priceRange: price,
    parking: yes(field(html, "Parking")) ? "Available" : null,
    amenities,
    paddleRental: yes(field(html, "Paddle for Rent Availability")),
    contact: phone,
    websiteUrl,
    socialUrl,
    bookingUrl,
    sourceUrl: post.link,
    sourceExternalId: post.slug,
    lastSeenAt: new Date(post.modified),
  };
}

async function fetchSource(attempt = 1): Promise<SourcePost[]> {
  try {
    const response = await fetch(sourceEndpoint, { signal: AbortSignal.timeout(30_000) });
    if (!response.ok) throw new Error(`Source returned ${response.status}`);
    return (await response.json()) as SourcePost[];
  } catch (error) {
    if (attempt >= 3) throw error;
    await new Promise((resolve) => setTimeout(resolve, attempt * 2_000));
    return fetchSource(attempt + 1);
  }
}

const parsedRecords = (await fetchSource()).map(parsePost).filter((record): record is VenueImport => Boolean(record));
const deduplicated = new Map<string, VenueImport>();
for (const record of parsedRecords) {
  const fingerprint = `${record.name} ${record.address}`
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
  deduplicated.set(fingerprint, record);
}
const officialCandidates: VenueImport[] = [
  {
    source: "smsupermalls.com",
    slug: "sm-seaside-city-cebu-pickleball-court",
    name: "SM Seaside City Cebu Pickleball Court",
    address: "Upper Ground Level, Tower Garden, Cube Wing, SM Seaside City Cebu, Cebu City",
    latitude: 10.28127,
    longitude: 123.8795782,
    environment: "outdoor",
    courtCount: 1,
    hours: null,
    priceRange: "Free play",
    parking: null,
    amenities: [],
    paddleRental: false,
    contact: null,
    websiteUrl:
      "https://www.smsupermalls.com/whats-new/lifestyle/sm-seaside-city-opens-cebus-first-outdoor-free-play-pickle-ball-court-in-cebu-city",
    socialUrl: null,
    bookingUrl: null,
    sourceUrl:
      "https://www.smsupermalls.com/whats-new/lifestyle/sm-seaside-city-opens-cebus-first-outdoor-free-play-pickle-ball-court-in-cebu-city",
    sourceExternalId: "sm-seaside-city-cebu-pickleball-court",
    lastSeenAt: new Date("2024-06-05T00:00:00+08:00"),
  },
];
for (const record of officialCandidates) {
  const fingerprint = `${record.name} ${record.address}`
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
  if (!deduplicated.has(fingerprint)) deduplicated.set(fingerprint, record);
}
const records = [...deduplicated.values()];
if (!records.length)
  throw new Error("No Cebu venue records were parsed; import stopped without changing the database.");

const sql = postgres(process.env.DATABASE_URL, { prepare: false, max: 1 });
try {
  await sql.begin(async (transaction) => {
    const activeSourceIds = records
      .filter((venue) => venue.source === sourceName)
      .map((venue) => venue.sourceExternalId);
    await transaction`
      UPDATE venues
      SET listing_status = 'archived', updated_at = now()
      WHERE source = ${sourceName}
        AND source_external_id IS NOT NULL
        AND NOT (source_external_id = ANY(${transaction.array(activeSourceIds)}))
    `;
    for (const venue of records) {
      const hours = venue.hours ? transaction.json(venue.hours) : null;
      await transaction`
        INSERT INTO venues (
          slug, name, address, latitude, longitude, environment, court_count, hours, price_range,
          parking, amenities, paddle_rental, contact, website_url, social_url, booking_url,
          listing_status, source, source_external_id, source_url, last_seen_at
        ) VALUES (
          ${venue.slug}, ${venue.name}, ${venue.address}, ${venue.latitude}, ${venue.longitude},
          ${venue.environment}, ${venue.courtCount}, ${hours}, ${venue.priceRange},
          ${venue.parking}, ${venue.amenities}, ${venue.paddleRental}, ${venue.contact}, ${venue.websiteUrl},
          ${venue.socialUrl}, ${venue.bookingUrl}, 'unverified', ${venue.source}, ${venue.sourceExternalId},
          ${venue.sourceUrl}, ${venue.lastSeenAt}
        )
        ON CONFLICT (source, source_external_id) DO UPDATE SET
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
          source_url = EXCLUDED.source_url,
          last_seen_at = EXCLUDED.last_seen_at,
          updated_at = now()
      `;
    }
  });
  console.log(`Imported ${records.length} sourced Cebu court listings as unverified candidates.`);
} finally {
  await sql.end();
}

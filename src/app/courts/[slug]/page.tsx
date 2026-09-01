import { ArrowSquareOut, MapPin } from "@phosphor-icons/react/dist/ssr";
import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { ButtonLink } from "@/components/ui/button";
import { getCurrentUser } from "@/features/auth/session";
import { getCourtListingBySlug } from "@/features/venues/directory";
import { getPublicEnv } from "@/lib/env";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const court = await getCourtListingBySlug((await params).slug);
  if (!court) return { title: "Court not found", robots: { index: false, follow: false } };
  const description = `${court.name} at ${court.address}. See court count, setting, price, paddle rental, parking, directions, and booking details.`;
  return {
    title: `${court.name} pickleball court`,
    description,
    alternates: { canonical: `/courts/${court.slug}` },
    openGraph: {
      title: `${court.name} pickleball court`,
      description,
      url: `/courts/${court.slug}`,
      type: "website",
    },
    twitter: { card: "summary_large_image", title: court.name, description },
  };
}

export default async function CourtPage({ params }: { params: Promise<{ slug: string }> }) {
  const slug = (await params).slug;
  const [court, user] = await Promise.all([getCourtListingBySlug(slug), getCurrentUser()]);
  if (!court) notFound();

  const origin = getPublicEnv().NEXT_PUBLIC_APP_URL;
  const courtUrl = `${origin}/courts/${court.slug}`;
  const sameAs = [court.websiteUrl, court.socialUrl].filter((url): url is string => Boolean(url));
  const courtJsonLd = {
    "@context": "https://schema.org",
    "@type": "SportsActivityLocation",
    "@id": `${courtUrl}#court`,
    name: court.name,
    url: courtUrl,
    address: { "@type": "PostalAddress", streetAddress: court.address, addressCountry: "PH" },
    geo: { "@type": "GeoCoordinates", latitude: court.latitude, longitude: court.longitude },
    sameAs,
    additionalProperty: [
      court.courtCount ? { "@type": "PropertyValue", name: "Pickleball courts", value: court.courtCount } : null,
      court.environment ? { "@type": "PropertyValue", name: "Setting", value: court.environment } : null,
      court.paddleRental ? { "@type": "LocationFeatureSpecification", name: "Paddle rental", value: true } : null,
      court.parking ? { "@type": "LocationFeatureSpecification", name: "Parking", value: court.parking } : null,
    ].filter(Boolean),
  };

  const gamePath = `/games/new?${new URLSearchParams({ venue: court.name, address: court.address }).toString()}`;
  const createHref = user ? gamePath : `/signup?next=${encodeURIComponent(gamePath)}`;

  return (
    <div className="mx-auto w-full max-w-6xl">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(courtJsonLd).replaceAll("<", "\\u003c") }}
      />
      <p className="text-sm font-semibold text-primary">Verified Philippines court</p>
      <h1 className="mt-2 app-title">{court.name}</h1>
      <p className="mt-3 flex items-start gap-2 text-muted">
        <MapPin className="mt-0.5 shrink-0" size={18} />
        {court.address}
      </p>
      <div className="mt-8 grid gap-x-8 gap-y-5 border-y border-line py-6 sm:grid-cols-2">
        <div>
          <p className="text-sm text-muted">Courts</p>
          <p className="mt-1 font-semibold">{court.courtCount ?? "Ask the court"}</p>
        </div>
        <div>
          <p className="text-sm text-muted">Setting</p>
          <p className="mt-1 font-semibold capitalize">{court.environment ?? "Not listed"}</p>
        </div>
        <div>
          <p className="text-sm text-muted">Price</p>
          <p className="mt-1 font-semibold">{court.priceRange ?? "Ask the court"}</p>
        </div>
        <div>
          <p className="text-sm text-muted">Paddle rental</p>
          <p className="mt-1 font-semibold">{court.paddleRental ? "Available" : "Not listed"}</p>
        </div>
      </div>
      {court.parking ? (
        <section className="mt-8">
          <h2 className="font-bold">Parking</h2>
          <p className="mt-2 text-muted">{court.parking}</p>
        </section>
      ) : null}
      {court.amenities?.length ? (
        <section className="mt-8">
          <h2 className="font-bold">Amenities</h2>
          <p className="mt-2 text-muted">{court.amenities.join(" · ")}</p>
        </section>
      ) : null}
      <div className="mt-9 flex flex-wrap gap-3">
        <ButtonLink href={createHref}>Plan a game here</ButtonLink>
        {court.bookingUrl ? (
          <ButtonLink href={court.bookingUrl} target="_blank" variant="secondary">
            Open booking <ArrowSquareOut aria-hidden size={16} />
          </ButtonLink>
        ) : court.websiteUrl ? (
          <ButtonLink href={court.websiteUrl} target="_blank" variant="secondary">
            Court website <ArrowSquareOut aria-hidden size={16} />
          </ButtonLink>
        ) : null}
        <ButtonLink
          href={`https://www.google.com/maps/search/?api=1&query=${court.latitude && court.longitude ? `${court.latitude},${court.longitude}` : encodeURIComponent(`${court.name} ${court.address}`)}`}
          target="_blank"
          variant="secondary"
        >
          Directions <ArrowSquareOut aria-hidden size={16} />
        </ButtonLink>
      </div>
      <p className="mt-4 text-xs leading-5 text-muted">
        Book and pay with the court. Check current rates, hours, and rules before you go.
        {court.sourceUrl ? (
          <>
            {" "}
            <a
              href={court.sourceUrl}
              target="_blank"
              rel="noreferrer"
              className="underline underline-offset-2 hover:text-ink"
            >
              View source
            </a>
            .
          </>
        ) : null}
      </p>
    </div>
  );
}

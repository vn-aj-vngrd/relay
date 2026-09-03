import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Script from "next/script";

import { getCurrentUser } from "@/features/auth/session";
import { CourtDetails } from "@/features/venues/court-details";
import { getCourtListingBySlug } from "@/features/venues/directory";
import { getPublicEnv } from "@/lib/env";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const court = await getCourtListingBySlug((await params).slug);
  if (!court) return { title: "Court not found", robots: { index: false, follow: false } };
  const description = `${court.name} at ${court.address}. See access, court count, setting, price, parking, hours, directions, and booking information.`;
  return {
    title: `${court.name} pickleball court`,
    description,
    alternates: { canonical: `/courts/${court.slug}` },
    openGraph: { title: `${court.name} pickleball court`, description, url: `/courts/${court.slug}`, type: "website" },
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
      { "@type": "PropertyValue", name: "Access", value: court.accessType },
      court.paddleRental ? { "@type": "LocationFeatureSpecification", name: "Paddle rental", value: true } : null,
      court.parkingLabel
        ? { "@type": "LocationFeatureSpecification", name: "Parking", value: court.parkingLabel }
        : null,
    ].filter(Boolean),
  };

  return (
    <>
      <Script
        id={`court-json-ld-${court.id}`}
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(courtJsonLd).replaceAll("<", "\\u003c") }}
      />
      <CourtDetails court={court} isAuthenticated={Boolean(user)} />
    </>
  );
}

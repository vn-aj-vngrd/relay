import { ArrowSquareOut, MapPin } from "@phosphor-icons/react/dist/ssr";
import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { ButtonLink } from "@/components/ui/button";
import { getCurrentUser } from "@/features/auth/session";
import { formatCourtOperatingHours } from "@/features/venues/details";
import { getCourtListingBySlug } from "@/features/venues/directory";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const court = await getCourtListingBySlug((await params).slug);
  if (!court) return { title: "Court not found" };
  return {
    title: court.name,
    description: `${court.name} in the Philippines. Check the address, court details, directions, and booking link.`,
  };
}

export default async function CourtPage({ params }: { params: Promise<{ slug: string }> }) {
  const slug = (await params).slug;
  const [court, user] = await Promise.all([getCourtListingBySlug(slug), getCurrentUser()]);
  if (!court) notFound();

  const gamePath = `/games/new?${new URLSearchParams({ venue: court.name, address: court.address }).toString()}`;
  const createHref = user ? gamePath : `/signup?next=${encodeURIComponent(gamePath)}`;

  return (
    <div className="mx-auto w-full max-w-6xl">
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
          <p className="mt-1 font-mono font-semibold tabular-nums">{court.priceLabel ?? "Ask the court"}</p>
        </div>
        <div>
          <p className="text-sm text-muted">Parking</p>
          <p className="mt-1 font-semibold">{court.parkingLabel ?? "Not listed"}</p>
        </div>
        <div>
          <p className="text-sm text-muted">Paddle rental</p>
          <p className="mt-1 font-semibold">{court.paddleRental ? "Available" : "Not listed"}</p>
        </div>
        <div className="sm:col-span-2">
          <p className="text-sm text-muted">Operating hours</p>
          <p className="mt-1 font-semibold">{formatCourtOperatingHours(court.operatingHours) ?? "Ask the court"}</p>
        </div>
      </div>
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

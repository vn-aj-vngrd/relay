import { ArrowSquareOut, MapPin } from "@phosphor-icons/react/dist/ssr";
import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";

import { ButtonLink } from "@/components/ui/button";
import { db } from "@/db/client";
import { venues } from "@/db/schema";

export default async function VenuePage({ params }: { params: Promise<{ slug: string }> }) {
  const venue = await db.query.venues.findFirst({ where: eq(venues.slug, (await params).slug) });
  if (!venue) notFound();
  return (
    <div className="mx-auto w-full max-w-4xl">
      <p className="text-sm font-semibold text-primary">Venue</p>
      <h1 className="mt-2 app-title">{venue.name}</h1>
      <p className="mt-3 flex items-start gap-2 text-muted">
        <MapPin className="mt-0.5 shrink-0" size={18} />
        {venue.address}
      </p>
      <div className="mt-8 grid gap-x-8 gap-y-5 border-y border-line py-6 sm:grid-cols-2">
        <div>
          <p className="text-sm text-muted">Courts</p>
          <p className="mt-1 font-semibold">{venue.courtCount ?? "Ask venue"}</p>
        </div>
        <div>
          <p className="text-sm text-muted">Setting</p>
          <p className="mt-1 font-semibold capitalize">{venue.environment ?? "Not specified"}</p>
        </div>
        <div>
          <p className="text-sm text-muted">Price</p>
          <p className="mt-1 font-semibold">{venue.priceRange ?? "Contact venue"}</p>
        </div>
        <div>
          <p className="text-sm text-muted">Paddle rental</p>
          <p className="mt-1 font-semibold">{venue.paddleRental ? "Available" : "Not listed"}</p>
        </div>
      </div>
      {venue.parking ? (
        <section className="mt-8">
          <h2 className="font-bold">Parking</h2>
          <p className="mt-2 text-muted">{venue.parking}</p>
        </section>
      ) : null}
      {venue.amenities?.length ? (
        <section className="mt-8">
          <h2 className="font-bold">Amenities</h2>
          <p className="mt-2 text-muted">{venue.amenities.join(" · ")}</p>
        </section>
      ) : null}
      <div className="mt-9 flex flex-wrap gap-3">
        {venue.bookingUrl ? (
          <ButtonLink href={venue.bookingUrl} target="_blank">
            Book on venue site <ArrowSquareOut size={16} />
          </ButtonLink>
        ) : null}
        <ButtonLink href={`/games/new`} variant="secondary">
          Create a game here
        </ButtonLink>
      </div>
      <p className="mt-4 text-xs text-muted">
        Relay doesn’t process court bookings. Confirm your reservation with the venue, then mark it booked in your game.
      </p>
    </div>
  );
}

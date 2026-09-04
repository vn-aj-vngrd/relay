import {
  ArrowSquareOut,
  CheckCircle,
  MapPin,
  PencilSimple,
} from "@phosphor-icons/react/dist/ssr";
import Link from "next/link";

import { ButtonLink } from "@/components/ui/button";

import {
  formatCourtAccess,
  formatCourtOperatingHours,
  formatCourtOperationalStatus,
  formatCourtReservation,
} from "./details";
import type { CourtListing } from "./directory";

function updateHref(court: CourtListing, isAuthenticated: boolean) {
  const path = `/courts/suggest?${new URLSearchParams({ court: court.slug }).toString()}`;
  return isAuthenticated ? path : `/signup?next=${encodeURIComponent(path)}`;
}

function reviewedLabel(court: CourtListing) {
  const checkedAt = court.lastSeenAt ?? court.verifiedAt;
  if (!checkedAt) return "Review date not listed";
  return `Reviewed ${new Intl.DateTimeFormat("en-PH", { dateStyle: "medium", timeZone: "Asia/Manila" }).format(checkedAt)}`;
}

export function CourtDetails({
  court,
  isAuthenticated,
}: {
  court: CourtListing;
  isAuthenticated: boolean;
}) {
  const gamePath = `/games/new?${new URLSearchParams({ venueId: court.id }).toString()}`;
  const createHref = gamePath;
  const operationalLabel = formatCourtOperationalStatus(
    court.operationalStatus
  );
  const isOperating = court.operationalStatus === "operating";

  return (
    <div className="mx-auto w-full max-w-6xl">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm font-semibold">
        <span className="inline-flex items-center gap-1.5 text-primary">
          <CheckCircle aria-hidden size={16} weight="fill" /> Relay reviewed
        </span>
        <span className="text-muted">{reviewedLabel(court)}</span>
      </div>
      <h1 className="mt-2 app-title">{court.name}</h1>
      <p className="mt-3 flex items-start gap-2 text-muted">
        <MapPin className="mt-0.5 shrink-0" size={18} />
        {court.address}
      </p>

      {!isOperating && court.operationalStatus !== "unknown" ? (
        <div className="mt-6 border-y border-line bg-surface-raised px-4 py-3 text-sm">
          <strong>{operationalLabel}.</strong>{" "}
          <span className="text-muted">
            Confirm with the court before making plans.
          </span>
        </div>
      ) : null}

      <section aria-labelledby="court-practical-details" className="mt-8">
        <h2 id="court-practical-details" className="text-lg font-[680]">
          Plan your visit
        </h2>
        <dl className="mt-4 grid gap-x-8 border-y border-line sm:grid-cols-2">
          {[
            ["Access", formatCourtAccess(court.accessType)],
            ["Reservations", formatCourtReservation(court.reservationPolicy)],
            ["Courts", court.courtCount ?? "Ask the court"],
            [
              "Setting",
              court.environment
                ? court.environment.replace("semi-indoor", "Semi-indoor")
                : "Not listed",
            ],
            ["Price", court.priceLabel ?? "Ask the court"],
            ["Parking", court.parkingLabel ?? "Not listed"],
            ["Paddle rental", court.paddleRental ? "Available" : "Not listed"],
            [
              "Operating hours",
              formatCourtOperatingHours(court.operatingHours) ??
                "Ask the court",
            ],
          ].map(([label, value]) => (
            <div
              key={label}
              className="border-b border-line py-4 last:border-b-0 sm:[&:nth-last-child(-n+2)]:border-b-0"
            >
              <dt className="text-sm text-muted">{label}</dt>
              <dd
                className={`mt-1 font-semibold ${label === "Price" ? "font-mono tabular-nums" : ""}`}
              >
                {value}
              </dd>
            </div>
          ))}
        </dl>
      </section>

      {court.amenities.length ? (
        <section className="mt-8">
          <h2 className="text-lg font-[680]">Amenities</h2>
          <p className="mt-2 leading-6 text-muted">
            {court.amenities.join(" · ")}
          </p>
        </section>
      ) : null}

      <div className="mt-9 flex flex-wrap gap-3">
        <ButtonLink href={createHref}>Plan a game here</ButtonLink>
        {court.bookingUrl ? (
          <ButtonLink
            href={court.bookingUrl}
            target="_blank"
            variant="secondary"
          >
            Open external booking <ArrowSquareOut aria-hidden size={16} />
          </ButtonLink>
        ) : court.websiteUrl ? (
          <ButtonLink
            href={court.websiteUrl}
            target="_blank"
            variant="secondary"
          >
            Court website <ArrowSquareOut aria-hidden size={16} />
          </ButtonLink>
        ) : null}
        <ButtonLink
          href={`https://www.google.com/maps/search/?api=1&query=${court.latitude},${court.longitude}`}
          target="_blank"
          variant="secondary"
        >
          Directions <ArrowSquareOut aria-hidden size={16} />
        </ButtonLink>
      </div>

      <div className="mt-8 flex flex-col items-start gap-3 border-t border-line pt-6 sm:flex-row sm:items-center sm:justify-between">
        <p className="max-w-2xl text-xs leading-5 text-muted">
          Relay does not manage bookings or live court availability. Confirm
          current rates, hours, access rules, and availability with the court
          before you go.
          {court.sourceUrl ? (
            <>
              {" "}
              <a
                href={court.sourceUrl}
                target="_blank"
                rel="noreferrer"
                className="underline underline-offset-2 hover:text-ink"
              >
                View verification source
              </a>
              .
            </>
          ) : null}
        </p>
        <Link
          href={updateHref(court, isAuthenticated)}
          className="pressable inline-flex min-h-11 shrink-0 items-center gap-2 rounded-lg px-3 text-sm font-semibold text-primary hover:bg-primary-soft"
        >
          <PencilSimple aria-hidden size={16} /> Suggest an update
        </Link>
      </div>
    </div>
  );
}

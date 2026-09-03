import { ArrowSquareOut } from "@phosphor-icons/react/dist/ssr";
import Link from "next/link";
import { notFound } from "next/navigation";

import { AdminPageHeading } from "@/features/admin/admin-page-heading";
import { getAdminVenue } from "@/features/admin/queries";
import { AdminVenueForm } from "@/features/venues/admin-venue-form";

export default async function AdminCourtPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const venue = await getAdminVenue((await params).id);
  if (!venue) notFound();

  return (
    <div>
      <AdminPageHeading
        title={venue.name}
        description={`${venue.listingStatus} · ${venue.source}`}
        action={
          venue.sourceUrl ? (
            <Link
              href={venue.sourceUrl}
              target="_blank"
              rel="noreferrer"
              className="pressable inline-flex min-h-9 items-center gap-1.5 rounded-lg border border-line bg-surface px-3 text-[13px] font-semibold text-ink hover:bg-surface-strong"
            >
              Open source <ArrowSquareOut aria-hidden size={14} />
            </Link>
          ) : undefined
        }
      />
      <div className="max-w-3xl">
        <AdminVenueForm venue={venue} />
      </div>
    </div>
  );
}

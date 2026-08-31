import { CourtFinder } from "@/features/venues/court-finder";
import { getCourtListings } from "@/features/venues/directory";

export default async function CourtPage() {
  const courts = await getCourtListings();

  return (
    <div className="court-finder-workspace flex min-h-0 flex-col xl:h-full">
      <h1 className="sr-only">Court finder</h1>
      <CourtFinder
        venues={courts}
        isAuthenticated
        detailBasePath="/court"
        showFilterTopBorder={false}
        className="flex min-h-0 flex-1 flex-col"
      />
    </div>
  );
}

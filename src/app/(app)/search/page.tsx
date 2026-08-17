import { requireUser } from "@/features/auth/session";
import { searchFilters, type SearchFilter } from "@/features/search/domain";
import { GlobalSearch } from "@/features/search/global-search";

export default async function SearchPage({ searchParams }: { searchParams: Promise<{ q?: string; type?: string }> }) {
  await requireUser();
  const params = await searchParams;
  const filter: SearchFilter = searchFilters.includes(params.type as SearchFilter) ? params.type as SearchFilter : "all";
  return <GlobalSearch initialQuery={(params.q ?? "").slice(0, 80)} initialFilter={filter} />;
}

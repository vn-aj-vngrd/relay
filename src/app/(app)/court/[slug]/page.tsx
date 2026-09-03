import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { getCurrentUser } from "@/features/auth/session";
import { CourtDetails } from "@/features/venues/court-details";
import { getCourtListingBySlug } from "@/features/venues/directory";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const court = await getCourtListingBySlug((await params).slug);
  if (!court) return { title: "Court not found" };
  return {
    title: court.name,
    description: `${court.name} in the Philippines. Check access, price, hours, directions, and booking information.`,
  };
}

export default async function CourtPage({ params }: { params: Promise<{ slug: string }> }) {
  const slug = (await params).slug;
  const [court, user] = await Promise.all([getCourtListingBySlug(slug), getCurrentUser()]);
  if (!court) notFound();
  return <CourtDetails court={court} isAuthenticated={Boolean(user)} />;
}

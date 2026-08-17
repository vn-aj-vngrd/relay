import { redirect } from "next/navigation";

export default async function LegacyPublicCourtsPage({ params }: { params: Promise<{ slug: string }> }) {
  redirect(`/s/${(await params).slug}/play`);
}

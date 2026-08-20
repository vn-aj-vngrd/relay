import { redirect } from "next/navigation";

export default async function LegacyPublicRecapPage({ params }: { params: Promise<{ slug: string }> }) {
  redirect(`/s/${(await params).slug}/play`);
}

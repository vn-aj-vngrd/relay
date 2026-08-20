import { redirect } from "next/navigation";

export default async function LegacyGameRecapPage({ params }: { params: Promise<{ id: string }> }) {
  redirect(`/games/${(await params).id}/play`);
}

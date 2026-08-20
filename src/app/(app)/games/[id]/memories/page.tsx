import { redirect } from "next/navigation";

export default async function LegacyGameMemoriesPage({ params }: { params: Promise<{ id: string }> }) {
  redirect(`/games/${(await params).id}/story`);
}

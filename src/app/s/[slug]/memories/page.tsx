import { redirect } from "next/navigation";

export default async function LegacyPublicMemoriesPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  redirect(`/s/${(await params).slug}/story`);
}

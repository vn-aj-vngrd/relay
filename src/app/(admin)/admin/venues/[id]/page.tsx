import { redirect } from "next/navigation";

export default async function LegacyAdminVenuePage({ params }: { params: Promise<{ id: string }> }) {
  redirect(`/admin/courts/${(await params).id}`);
}

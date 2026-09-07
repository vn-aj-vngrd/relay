import { notFound, redirect } from "next/navigation";

import {
  type PlayersSearchParams,
  playersDestination,
} from "@/features/sessions/players-destination";
import { getPublicSession } from "@/features/sessions/queries";

export default async function PlayersPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<PlayersSearchParams>;
}) {
  const { slug } = await params;
  const data = await getPublicSession(slug);
  if (!data) notFound();
  redirect(playersDestination(`/s/${data.session.slug}`, await searchParams));
}

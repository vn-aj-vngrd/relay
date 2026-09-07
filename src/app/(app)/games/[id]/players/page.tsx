import { notFound, redirect } from "next/navigation";
import { requireUser } from "@/features/auth/session";
import {
  type PlayersSearchParams,
  playersDestination,
} from "@/features/sessions/players-destination";
import { getSessionForWorkspace } from "@/features/sessions/queries";

export default async function PlayersPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<PlayersSearchParams>;
}) {
  const user = await requireUser();
  const { id } = await params;
  const data = await getSessionForWorkspace(id, user.id);
  if (!data) notFound();
  redirect(playersDestination(`/games/${data.session.id}`, await searchParams));
}

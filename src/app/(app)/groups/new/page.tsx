import { ArrowLeft } from "@phosphor-icons/react/dist/ssr";
import { and, eq, isNotNull } from "drizzle-orm";
import Link from "next/link";

import { db } from "@/db/client";
import { sessionPlayers, sessions } from "@/db/schema";
import { requireUser } from "@/features/auth/session";
import { CreateGroupForm } from "@/features/groups/group-form";

export default async function NewGroupPage({
  searchParams,
}: {
  searchParams: Promise<{ from?: string }>;
}) {
  const user = await requireUser();
  const sourceId = (await searchParams).from;
  const source = sourceId
    ? await db.query.sessions.findFirst({
        where: and(eq(sessions.id, sourceId), eq(sessions.hostId, user.id)),
      })
    : null;
  const savedPlayerCount = source
    ? await db.$count(
        sessionPlayers,
        and(
          eq(sessionPlayers.sessionId, source.id),
          eq(sessionPlayers.rsvp, "going"),
          isNotNull(sessionPlayers.userId)
        )
      )
    : 0;
  return (
    <div className="w-full">
      <Link
        href={source ? `/games/${source.id}` : "/groups"}
        className="inline-flex min-h-10 items-center gap-2 text-sm font-semibold text-muted hover:text-ink"
      >
        <ArrowLeft aria-hidden size={16} />
        {source ? "Back to game" : "Back to groups"}
      </Link>
      <div className="mt-5">
        <h1 className="app-title">
          {source ? "Save this crew" : "Create a group"}
        </h1>
        <p className="mt-2 leading-7 text-muted">
          {source
            ? "Keep the signed-in players together for faster invites and shared game history."
            : "Groups are for people you play with regularly. You can still create standalone games anytime."}
        </p>
      </div>
      <CreateGroupForm
        sourceSessionId={source?.id}
        defaultName={source ? `${source.title} Crew` : undefined}
        savedPlayerCount={savedPlayerCount}
      />
    </div>
  );
}

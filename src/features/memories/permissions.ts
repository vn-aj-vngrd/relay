export type MemoryContributionActor = {
  userId?: string | null;
  player?: {
    role: string;
    rsvp: string;
  } | null;
};

export function canContributeMemory(
  session: { hostId: string; status: string },
  actor: MemoryContributionActor
) {
  if (session.status !== "completed") return false;
  return Boolean(
    (actor.userId && actor.userId === session.hostId) ||
      actor.player?.role === "host" ||
      actor.player?.role === "cohost" ||
      actor.player?.rsvp === "going"
  );
}

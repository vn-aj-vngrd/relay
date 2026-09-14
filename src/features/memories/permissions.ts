export function allowsGamePhotos(status: string) {
  return ["published", "live", "completed"].includes(status);
}

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
  if (!allowsGamePhotos(session.status)) return false;
  return Boolean(
    (actor.userId && actor.userId === session.hostId) ||
      actor.player?.role === "host" ||
      actor.player?.role === "cohost" ||
      actor.player?.rsvp === "going"
  );
}

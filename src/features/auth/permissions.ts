export type SessionActor = {
  userId?: string;
  guestPlayerId?: string;
  role?: "host" | "cohost" | "player";
  assignedScorer?: boolean;
};

const participatingRsvps = new Set(["going", "maybe", "waitlisted"]);

export function sessionActor(input: {
  userId: string;
  hostId: string;
  membership?: {
    role: "host" | "cohost" | "player";
    rsvp: string;
    leftAt: Date | null;
  } | null;
}): SessionActor {
  if (input.userId === input.hostId)
    return { userId: input.userId, role: "host" };
  const membership = input.membership;
  const role =
    membership && !membership.leftAt && participatingRsvps.has(membership.rsvp)
      ? membership.role
      : undefined;
  return { userId: input.userId, role };
}
export type SessionAction =
  | "view"
  | "edit"
  | "manage_roster"
  | "score"
  | "own_rsvp"
  | "own_payment"
  | "confirm_payment"
  | "create_expense"
  | "complete"
  | "delete"
  | "contribute";

export function can(
  actor: SessionActor,
  action: SessionAction,
  options: { publicVisible?: boolean; participant?: boolean } = {}
): boolean {
  if (action === "view")
    return Boolean(
      options.publicVisible || actor.userId || actor.guestPlayerId
    );
  if (action === "own_rsvp" || action === "own_payment")
    return Boolean(actor.userId || actor.guestPlayerId);
  if (action === "contribute")
    return Boolean(
      options.participant && (actor.userId || actor.guestPlayerId)
    );
  if (action === "score")
    return (
      actor.role === "host" ||
      actor.role === "cohost" ||
      Boolean(actor.userId && actor.assignedScorer)
    );
  if (["edit", "manage_roster", "confirm_payment"].includes(action))
    return actor.role === "host" || actor.role === "cohost";
  if (
    action === "create_expense" ||
    action === "complete" ||
    action === "delete"
  )
    return actor.role === "host";
  return false;
}

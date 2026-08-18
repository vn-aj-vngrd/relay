export type SessionActor = {
  userId?: string;
  guestPlayerId?: string;
  role?: "host" | "cohost" | "player";
  assignedScorer?: boolean;
};
export type SessionAction =
  | "view"
  | "edit"
  | "manage_roster"
  | "score"
  | "own_rsvp"
  | "own_payment"
  | "confirm_payment"
  | "complete"
  | "delete"
  | "contribute";

export function can(
  actor: SessionActor,
  action: SessionAction,
  options: { publicVisible?: boolean; participant?: boolean } = {},
): boolean {
  if (action === "view") return Boolean(options.publicVisible || actor.userId || actor.guestPlayerId);
  if (action === "own_rsvp" || action === "own_payment") return Boolean(actor.userId || actor.guestPlayerId);
  if (action === "contribute") return Boolean(options.participant && (actor.userId || actor.guestPlayerId));
  if (action === "score") return actor.role === "host" || actor.role === "cohost" || Boolean(actor.assignedScorer);
  if (["edit", "manage_roster", "confirm_payment"].includes(action))
    return actor.role === "host" || actor.role === "cohost";
  if (action === "complete" || action === "delete") return actor.role === "host";
  return false;
}

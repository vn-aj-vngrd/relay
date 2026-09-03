type HomeRsvp =
  | "invited"
  | "pending"
  | "going"
  | "maybe"
  | "waitlisted"
  | "declined";

export function homeHeading({
  live,
  hasPrimary,
  hasTentative,
}: {
  live: boolean;
  hasPrimary: boolean;
  hasTentative: boolean;
}) {
  if (live) return "Your game is live.";
  if (hasPrimary) return "Your next game is set.";
  if (hasTentative) return "Your plans are taking shape.";
  return "Ready for your next game?";
}

export function homeParticipationLabel(
  rsvp: HomeRsvp,
  role: "host" | "cohost" | "player"
) {
  if (role === "host") return "Hosting";
  if (role === "cohost") return "Co-hosting";
  if (rsvp === "pending") return "Awaiting approval";
  if (rsvp === "waitlisted") return "Waitlisted";
  if (rsvp === "maybe") return "Maybe";
  if (rsvp === "going") return "Going";
  return null;
}

export function visibleHomePendingCount(
  count: number,
  role: "host" | "cohost" | "player",
  isHost: boolean
) {
  return isHost || role === "cohost" ? count : 0;
}

export function homePendingRequestLabel(count: number) {
  return `${count} ${count === 1 ? "request" : "requests"} waiting`;
}

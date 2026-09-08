import type { SessionRecap } from "./recap";

export type StoryPhase = "published" | "live" | "completed";

export type StoryInvitationFacts = {
  hostName: string;
  /** Complete player-price disclosure, including units when applicable. */
  priceLabel: string;
  goingCount: number;
  capacity: number;
  requiresApproval: boolean;
  waitlistOpen: boolean;
};

export type RecapShareTemplateId =
  | "invitation"
  | "spots"
  | "live"
  | "live-pulse"
  | "overview"
  | "personal"
  | "winning-team"
  | "leader"
  | "standings"
  | "closest"
  | "court"
  | "points"
  | "court-time"
  | "crew"
  | "custom";

export type RecapShareTemplate = {
  id: RecapShareTemplateId;
  label: string;
  description: string;
};

const templates: Record<RecapShareTemplateId, RecapShareTemplate> = {
  invitation: {
    id: "invitation",
    label: "Invitation",
    description: "The plan, price, and place",
  },
  spots: {
    id: "spots",
    label: "Who’s in?",
    description: "Open spots, Going count, and how to join",
  },
  live: {
    id: "live",
    label: "We’re playing",
    description: "Safe progress from the courts",
  },
  "live-pulse": {
    id: "live-pulse",
    label: "Match pulse",
    description: "Completed games, still going",
  },
  overview: {
    id: "overview",
    label: "Night recap",
    description: "Matches, points, and court time",
  },
  personal: {
    id: "personal",
    label: "My game",
    description: "Your wins and point difference",
  },
  "winning-team": {
    id: "winning-team",
    label: "Winning team",
    description: "The pair that clicked",
  },
  leader: {
    id: "leader",
    label: "Top of the table",
    description: "The session leader’s record",
  },
  standings: {
    id: "standings",
    label: "Standings",
    description: "The session table",
  },
  closest: {
    id: "closest",
    label: "Closest finish",
    description: "The tightest score of the night",
  },
  court: {
    id: "court",
    label: "Busiest court",
    description: "Where the most games happened",
  },
  points: {
    id: "points",
    label: "Points played",
    description: "One big number from the night",
  },
  "court-time": {
    id: "court-time",
    label: "Court time",
    description: "How long the games kept moving",
  },
  crew: {
    id: "crew",
    label: "The crew",
    description: "The names that made the night",
  },
  custom: {
    id: "custom",
    label: "Your story",
    description: "A photo and a line in your own words",
  },
};

export function invitationJoinCaption(
  template: "invitation" | "spots",
  facts: StoryInvitationFacts,
  mode: "qr" | "link"
) {
  const prefix = mode === "qr" ? "Scan to " : "";
  let action = "view game and RSVP";
  if (template === "spots") {
    action =
      facts.goingCount < facts.capacity
        ? "view game and join"
        : facts.waitlistOpen
          ? "join the waitlist"
          : "view game";
  }
  const caption = prefix + action;
  return caption[0].toUpperCase() + caption.slice(1);
}

export function invitationStateLabel(facts: StoryInvitationFacts) {
  if (facts.requiresApproval && facts.waitlistOpen)
    return "Host approval required · Waitlist open";
  if (facts.waitlistOpen) return "Full · waitlist open";
  const spots = Math.max(0, facts.capacity - facts.goingCount);
  const availability = `${spots} ${spots === 1 ? "spot" : "spots"} open`;
  return facts.requiresApproval
    ? `${availability} · Host approval required`
    : availability;
}

export function recapShareTemplates(
  recap: SessionRecap,
  viewerPlayerId?: string | null,
  phase: StoryPhase = "completed"
) {
  if (phase === "published") return [templates.invitation];
  if (phase === "live")
    return [templates.live, templates["live-pulse"], templates.invitation];
  if (recap.matchCount === 0) return [templates.custom];
  return [
    templates.overview,
    ...(viewerPlayerId &&
    recap.standings.some((row) => row.playerId === viewerPlayerId)
      ? [templates.personal]
      : []),
    ...(recap.topPair ? [templates["winning-team"]] : []),
    ...(recap.standout ? [templates.leader] : []),
    ...(recap.standings.length ? [templates.standings] : []),
    ...(recap.closestMatch ? [templates.closest] : []),
    ...(recap.busiestCourt ? [templates.court] : []),
    ...(recap.totalPoints ? [templates.points] : []),
    ...(recap.playMinutes ? [templates["court-time"]] : []),
    ...(recap.standings.length ? [templates.crew] : []),
    templates.custom,
  ];
}

export function viewerStanding(
  recap: SessionRecap,
  viewerPlayerId?: string | null
) {
  if (!viewerPlayerId) return null;
  const index = recap.standings.findIndex(
    (row) => row.playerId === viewerPlayerId
  );
  return index < 0 ? null : { ...recap.standings[index], rank: index + 1 };
}

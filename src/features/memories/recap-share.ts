import type { SessionRecap } from "./recap";

export type RecapShareTemplateId =
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

export function recapShareTemplates(
  recap: SessionRecap,
  viewerPlayerId?: string | null
) {
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

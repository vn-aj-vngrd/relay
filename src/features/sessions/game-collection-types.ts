export type GameCollectionItem = {
  id: string;
  href: string;
  title: string;
  date: string;
  dateKey: string;
  endsAt: string;
  time: string;
  venue: string;
  playerCount: number;
  capacity: number;
  status: "draft" | "published" | "live" | "completed" | "cancelled";
  accentColor: string;
  viewerRsvp:
    | "invited"
    | "pending"
    | "going"
    | "maybe"
    | "waitlisted"
    | "declined";
  invitedAt: string;
  hostName: string;
  estimatedCostCents: number | null;
  requiresApproval: boolean;
  spotsRemaining: number;
  canReplay: boolean;
  readiness?: {
    ready: boolean;
    percent: number;
    completed: number;
    total: number;
    missing: string[];
  };
};

export type GameCollectionPage = {
  items: GameCollectionItem[];
  nextCursor: string | null;
};

export type GameInvitationPage = {
  items: GameCollectionItem[];
  total: number;
};

export type GameCollectionPhase = "upcoming" | "past";

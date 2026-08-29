export type GameCollectionItem = {
  id: string;
  href: string;
  title: string;
  date: string;
  dateKey: string;
  time: string;
  venue: string;
  playerCount: number;
  capacity: number;
  status: "draft" | "published" | "live" | "completed" | "cancelled";
  accentColor: string;
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

export type GameCollectionPhase = "upcoming" | "past";

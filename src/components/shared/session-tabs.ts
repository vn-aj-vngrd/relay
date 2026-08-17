export const SESSION_TABS = [
  { label: "Overview", path: "" },
  { label: "Players", path: "/players" },
  { label: "Play", path: "/play" },
  { label: "Chat", path: "/chat" },
  { label: "Payments", path: "/payments" },
] as const;

export type SessionTabLabel = (typeof SESSION_TABS)[number]["label"];

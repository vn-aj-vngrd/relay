export const SESSION_TABS = [
  { label: "Overview", path: "" },
  { label: "Players", path: "/players" },
  { label: "Play", path: "/play" },
  { label: "Chat", path: "/chat" },
  { label: "Payments", path: "/payments" },
  { label: "Recap", path: "/recap" },
] as const;

export function sessionTabs() {
  return [...SESSION_TABS];
}

export type SessionTabLabel = (typeof SESSION_TABS)[number]["label"];

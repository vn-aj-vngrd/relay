"use client";

import { WarningCircle } from "@phosphor-icons/react";
import Link from "next/link";
import { createContext, useContext, useSyncExternalStore } from "react";
import { AgentMark } from "./agent-mark";
import type { AgentSession } from "./session";

export type AgentActivity = AgentSession["activity"];
export const AgentActivityContext = createContext({
  subscribe: (_listener: () => void) => () => {},
  snapshot: (): AgentActivity => "idle",
});
const idle = (): AgentActivity => "idle";
export function useAgentActivity() {
  const store = useContext(AgentActivityContext);
  return useSyncExternalStore(store.subscribe, store.snapshot, idle);
}
export function agentActivityLabel(activity: AgentActivity) {
  return activity === "working"
    ? "Agent, working"
    : activity === "completed"
      ? "Agent, reply ready"
      : activity === "error"
        ? "Agent, response needs attention"
        : "Agent";
}
export function AgentActivityIndicator({
  activity,
}: {
  activity: AgentActivity;
}) {
  if (activity === "idle") return null;
  return (
    <span
      aria-hidden
      className="agent-activity-indicator ml-auto grid h-4 w-4 shrink-0 place-items-center"
    >
      {activity === "working" ? (
        <span className="h-3 w-3 animate-spin rounded-full border-2 border-primary/25 border-t-primary motion-reduce:animate-none" />
      ) : activity === "error" ? (
        <WarningCircle size={14} className="text-danger" />
      ) : (
        <span className="h-2 w-2 rounded-full bg-primary" />
      )}
    </span>
  );
}
export function AgentMobileLink() {
  const activity = useAgentActivity();
  return (
    <Link
      href="/agent"
      prefetch={false}
      aria-label={agentActivityLabel(activity)}
      className="pressable relative grid h-11 w-11 place-items-center text-muted hover:text-ink"
    >
      <AgentMark aria-hidden size={20} />
      <span className="absolute right-0 top-0 rounded-full bg-surface">
        <AgentActivityIndicator activity={activity} />
      </span>
    </Link>
  );
}

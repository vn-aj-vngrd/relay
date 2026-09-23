"use client";

import type { Chat } from "@ai-sdk/react";
import type { UIMessage } from "ai";
import type { ReactNode } from "react";
import {
  createContext,
  useContext,
  useEffect,
  useState,
  useSyncExternalStore,
} from "react";

export type AgentSession = {
  activity: "idle" | "working" | "completed" | "error";
  chat: Chat<UIMessage> | null;
  draft: string;
  conversationId: string | null;
  title: string;
  remotePending: boolean;
  preparation: { controller: AbortController; question: UIMessage } | null;
  subscribe: (listener: () => void) => () => void;
  snapshot: () => number;
  notify: () => void;
};
const SessionContext = createContext<AgentSession | null>(null);

export function createAgentSession(): AgentSession {
  let revision = 0;
  const listeners = new Set<() => void>();
  return {
    activity: "idle",
    chat: null,
    draft: "",
    conversationId: null,
    title: "Your chats",
    preparation: null,
    remotePending: false,
    subscribe: (listener) => {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
    snapshot: () => revision,
    notify: () => {
      revision++;
      for (const listener of listeners) listener();
    },
  };
}
export function disposeAgentSession(session: AgentSession) {
  session.preparation?.controller.abort();
  session.preparation = null;
  void session.chat?.stop();
  if (session.chat) {
    session.chat.messages = [];
    session.chat.clearError();
  }
  session.draft = "";
  session.conversationId = null;
  session.title = "Your chats";
  session.remotePending = false;
  session.activity = "idle";
  session.notify();
}
export const AgentRuntimeContext = createContext<{
  get: (userId: string) => AgentSession;
} | null>(null);

// The authenticated boundary selects an account-owned session; the root runtime
// retains it when navigation replaces this route layout.
export function AgentSessionProvider({
  children,
  userId,
}: {
  children: ReactNode;
  userId?: string;
}) {
  const runtime = useContext(AgentRuntimeContext);
  const persistent = Boolean(runtime && userId);
  const [session] = useState(() =>
    runtime && userId ? runtime.get(userId) : createAgentSession()
  );
  useEffect(
    () => () => {
      if (!persistent) disposeAgentSession(session);
    },
    [session, persistent]
  );
  return <SessionContext value={session}>{children}</SessionContext>;
}

export function useAgentSession() {
  const session = useContext(SessionContext);
  if (!session) throw new Error("Agent requires an authenticated session");
  useSyncExternalStore(session.subscribe, session.snapshot, session.snapshot);
  return session;
}

"use client";

import type { Chat } from "@ai-sdk/react";
import type { UIMessage } from "ai";
import type { ReactNode } from "react";
import { createContext, useContext, useEffect, useState } from "react";

export type AgentSession = {
  chat: Chat<UIMessage> | null;
  draft: string;
  conversationId: string | null;
  title: string;
};
const SessionContext = createContext<AgentSession | null>(null);

// Owned by the authenticated layout, never a global or browser-storage cache.
// The SDK is initialized lazily when Agent is first opened.
export function AgentSessionProvider({ children }: { children: ReactNode }) {
  const [session] = useState<AgentSession>(() => ({
    chat: null,
    draft: "",
    conversationId: null,
    title: "Your chats",
  }));
  useEffect(
    () => () => {
      void session.chat?.stop();
    },
    [session]
  );
  return <SessionContext value={session}>{children}</SessionContext>;
}

export function useAgentSession() {
  const session = useContext(SessionContext);
  if (!session) throw new Error("Agent requires an authenticated session");
  return session;
}

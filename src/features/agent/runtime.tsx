"use client";

import type { AuthChangeEvent, Session } from "@supabase/supabase-js";
import { usePathname } from "next/navigation";
import { type ReactNode, useEffect, useState } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { AgentActivityContext } from "./activity";
import {
  AgentRuntimeContext,
  type AgentSession,
  createAgentSession,
  disposeAgentSession,
} from "./session";

export function AgentRuntimeProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const [runtime] = useState(() => {
    let active: { userId: string; session: AgentSession } | null = null;
    let viewingAgent = false;
    let unsubscribe: (() => void) | undefined;
    const listeners = new Set<() => void>();
    const emit = () => {
      if (viewingAgent && active && active.session.activity !== "working")
        active.session.activity = "idle";
      for (const listener of listeners) listener();
    };
    const clear = () => {
      unsubscribe?.();
      if (active) disposeAgentSession(active.session);
      active = null;
      emit();
    };
    return {
      clear,
      subscribe(listener: () => void) {
        listeners.add(listener);
        return () => {
          listeners.delete(listener);
        };
      },
      snapshot: () => active?.session.activity ?? "idle",
      view(path: string) {
        viewingAgent = path === "/agent";
        emit();
      },
      stop() {
        if (active) disposeAgentSession(active.session);
      },
      accountChanged(userId: string | null) {
        if (active && active.userId !== userId) clear();
      },
      get(userId: string) {
        if (active?.userId !== userId) {
          const previous = active;
          unsubscribe?.();
          active = { userId, session: createAgentSession() };
          unsubscribe = active.session.subscribe(emit);
          queueMicrotask(emit);
          if (previous)
            queueMicrotask(() => disposeAgentSession(previous.session));
        }
        return active.session;
      },
    };
  });
  useEffect(() => {
    const { data } = createSupabaseBrowserClient().auth.onAuthStateChange(
      (event: AuthChangeEvent, session: Session | null) => {
        if (event === "SIGNED_OUT") runtime.clear();
        else if (session) runtime.accountChanged(session.user.id);
      }
    );
    return () => {
      data.subscription.unsubscribe();
      runtime.stop();
    };
  }, [runtime]);
  // Server-action sign-out redirects without emitting a browser auth event.
  useEffect(() => {
    runtime.view(pathname);
    if (pathname === "/login" || pathname === "/signup") runtime.clear();
  }, [pathname, runtime]);
  return (
    <AgentActivityContext value={runtime}>
      <AgentRuntimeContext value={runtime}>{children}</AgentRuntimeContext>
    </AgentActivityContext>
  );
}

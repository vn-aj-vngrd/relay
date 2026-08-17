"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { RealtimeChannel } from "@supabase/supabase-js";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { SESSION_REALTIME_TABLES } from "./realtime-tables";

export function RealtimeRefresh({ sessionId, compact = false }: { sessionId: string; compact?: boolean }) {
  const router = useRouter();
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [status, setStatus] = useState<"connecting" | "connected" | "error">("connecting");
  useEffect(() => {
    const supabase = createSupabaseBrowserClient();
    let channel: RealtimeChannel | null = null;
    let cancelled = false;
    const refresh = () => { if (timer.current) clearTimeout(timer.current); timer.current = setTimeout(() => router.refresh(), 120); };

    void (async () => {
      const { data } = await supabase.auth.getSession();
      if (data.session) supabase.realtime.setAuth(data.session.access_token);
      if (cancelled) return;
      let nextChannel = supabase.channel(`session:${sessionId}`);
      for (const table of SESSION_REALTIME_TABLES) nextChannel = nextChannel.on("postgres_changes", { event: "*", schema: "public", table, filter: `session_id=eq.${sessionId}` }, refresh);
      channel = nextChannel;
      nextChannel.subscribe((next: string) => setStatus(next === "SUBSCRIBED" ? "connected" : next === "CHANNEL_ERROR" || next === "TIMED_OUT" ? "error" : "connecting"));
    })();

    return () => {
      cancelled = true;
      if (timer.current) clearTimeout(timer.current);
      if (channel) void supabase.removeChannel(channel);
    };
  }, [router, sessionId]);
  const text = status === "connected" ? (compact ? "Synced" : "Everyone is up to date") : status === "error" ? (compact ? "Offline" : "Live updates paused—refresh to retry") : (compact ? "Connecting" : "Connecting live updates…");
  return <span aria-live="polite" title={compact && status === "error" ? "Live updates paused—refresh to retry" : undefined} className={`inline-flex min-h-11 items-center gap-2 text-sm font-medium ${status === "error" ? "text-danger" : "text-muted"}`}><span className={`h-2 w-2 rounded-full ${status === "connected" ? "bg-success" : status === "error" ? "bg-danger" : "bg-warning"}`} />{text}</span>;
}

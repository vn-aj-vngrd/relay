"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { SESSION_REALTIME_TABLES } from "./realtime-tables";

export function RealtimeRefresh({ sessionId, compact = false }: { sessionId: string; compact?: boolean }) {
  const router = useRouter();
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [status, setStatus] = useState<"connecting" | "connected" | "error">("connecting");
  useEffect(() => {
    const supabase = createSupabaseBrowserClient();
    let channel = supabase.channel(`session:${sessionId}`);
    const refresh = () => { if (timer.current) clearTimeout(timer.current); timer.current = setTimeout(() => router.refresh(), 120); };
    for (const table of SESSION_REALTIME_TABLES) channel = channel.on("postgres_changes", { event: "*", schema: "public", table, filter: `session_id=eq.${sessionId}` }, refresh);
    channel.subscribe((next: string) => setStatus(next === "SUBSCRIBED" ? "connected" : next === "CHANNEL_ERROR" || next === "TIMED_OUT" ? "error" : "connecting"));
    return () => { if (timer.current) clearTimeout(timer.current); void supabase.removeChannel(channel); };
  }, [router, sessionId]);
  const text = status === "connected" ? (compact ? "Synced" : "Everyone is up to date") : status === "error" ? (compact ? "Offline" : "Live updates paused—refresh to retry") : (compact ? "Connecting" : "Connecting live updates…");
  return <span aria-live="polite" title={compact && status === "error" ? "Live updates paused—refresh to retry" : undefined} className={`inline-flex min-h-11 items-center gap-2 text-sm font-medium ${status === "error" ? "text-danger" : "text-muted"}`}><span className={`h-2 w-2 rounded-full ${status === "connected" ? "bg-success" : status === "error" ? "bg-danger" : "bg-warning"}`} />{text}</span>;
}

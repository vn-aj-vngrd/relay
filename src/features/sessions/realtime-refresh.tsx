"use client";

import type { RealtimeChannel } from "@supabase/supabase-js";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import { createSupabaseBrowserClient } from "@/lib/supabase/client";

export function RealtimeRefresh({
  sessionId,
  compact = false,
  silent = false,
}: {
  sessionId: string;
  compact?: boolean;
  silent?: boolean;
}) {
  const router = useRouter();
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [status, setStatus] = useState<"connecting" | "connected" | "error">(
    "connecting"
  );
  useEffect(() => {
    const supabase = createSupabaseBrowserClient();
    let channel: RealtimeChannel | null = null;
    let cancelled = false;
    const refresh = () => {
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(() => router.refresh(), 120);
    };

    void (async () => {
      if (cancelled) return;
      const nextChannel = supabase
        .channel(`session:${sessionId}`)
        .on("broadcast", { event: "changed" }, refresh);
      channel = nextChannel;
      nextChannel.subscribe((next: string) => {
        if (next === "SUBSCRIBED") {
          setStatus("connected");
          refresh();
        } else
          setStatus(
            next === "CHANNEL_ERROR" || next === "TIMED_OUT"
              ? "error"
              : "connecting"
          );
      });
    })();

    return () => {
      cancelled = true;
      if (timer.current) clearTimeout(timer.current);
      if (channel) void supabase.removeChannel(channel);
    };
  }, [router, sessionId]);
  if (status === "connected")
    return (
      <span className="sr-only" aria-live="polite">
        Live updates connected
      </span>
    );
  const text =
    status === "error"
      ? compact
        ? "Offline"
        : "Live updates paused—refresh to retry"
      : compact
        ? "Connecting"
        : "Connecting live updates…";
  if (silent)
    return (
      <span className="sr-only" aria-live="polite">
        {text}
      </span>
    );
  return (
    <span
      aria-live="polite"
      title={
        compact && status === "error"
          ? "Live updates paused—refresh to retry"
          : undefined
      }
      className={`inline-flex min-h-9 items-center gap-2 text-[13px] font-medium ${status === "error" ? "text-danger" : "text-muted"}`}
    >
      <span
        className={`h-2 w-2 rounded-full ${status === "error" ? "bg-danger" : "bg-warning"}`}
      />
      {text}
    </span>
  );
}

"use client";

import type { RealtimeChannel } from "@supabase/supabase-js";
import { useRouter } from "next/navigation";
import { useEffect, useRef } from "react";

import { createSupabaseBrowserClient } from "@/lib/supabase/client";

export function NotificationRealtimeRefresh({ userId }: { userId: string }) {
  const router = useRouter();
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const supabase = createSupabaseBrowserClient();
    let channel: RealtimeChannel | null = null;
    let cancelled = false;
    const refresh = () => {
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(() => router.refresh(), 150);
    };

    void (async () => {
      const { data } = await supabase.auth.getSession();
      if (data.session) supabase.realtime.setAuth(data.session.access_token);
      if (cancelled) return;
      const nextChannel = supabase
        .channel(`notifications:${userId}`)
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: "notifications", filter: `user_id=eq.${userId}` },
          refresh,
        );
      channel = nextChannel;
      nextChannel.subscribe((status: string) => {
        if (status === "SUBSCRIBED") refresh();
      });
    })();

    return () => {
      cancelled = true;
      if (timer.current) clearTimeout(timer.current);
      if (channel) void supabase.removeChannel(channel);
    };
  }, [router, userId]);

  return null;
}

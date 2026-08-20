"use client";

import { CloudSlash } from "@phosphor-icons/react";
import { useOffline } from "next/offline";

export function OfflineIndicator() {
  const offline = useOffline();
  if (!offline) return null;

  return (
    <div
      role="status"
      className="fixed inset-x-4 bottom-[calc(5.5rem+env(safe-area-inset-bottom))] z-50 mx-auto flex min-h-10 max-w-sm items-center justify-center gap-2 rounded-lg border border-line bg-surface px-3 py-2 text-center text-xs font-semibold text-ink shadow-[0_4px_8px_rgb(13_15_20/.14)] md:bottom-4"
    >
      <CloudSlash aria-hidden className="shrink-0 text-warning" size={16} />
      Offline · live data will refresh when connection returns
    </div>
  );
}

"use client";

import { useEffect, useRef, type ReactNode } from "react";

export function ChatThread({ children, messageCount }: { children: ReactNode; messageCount: number }) {
  const endRef = useRef<HTMLDivElement>(null);
  useEffect(() => { endRef.current?.scrollIntoView({ block: "end", behavior: messageCount > 1 ? "smooth" : "auto" }); }, [messageCount]);
  return <div role="log" aria-live="polite" aria-relevant="additions" className="min-h-[360px] py-5">{children}<div ref={endRef} /></div>;
}

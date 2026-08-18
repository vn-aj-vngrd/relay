"use client";

import { type ReactNode, useEffect, useRef } from "react";

export function ChatThread({ children, messageCount }: { children: ReactNode; messageCount: number }) {
  const threadRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const thread = threadRef.current;
    if (!thread) return;
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    thread.scrollTo({ top: thread.scrollHeight, behavior: messageCount > 1 && !reduceMotion ? "smooth" : "auto" });
  }, [messageCount]);
  return (
    <div
      ref={threadRef}
      role="log"
      aria-label="Session messages"
      aria-live="polite"
      aria-relevant="additions"
      tabIndex={0}
      className="chat-thread-scroll public-session-chat-thread min-h-0 flex-1 overflow-y-auto overscroll-contain py-5"
    >
      {children}
    </div>
  );
}

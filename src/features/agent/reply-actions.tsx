"use client";
import { Check, Copy } from "@phosphor-icons/react";
import { useEffect, useRef, useState } from "react";
import { notify } from "@/components/ui/action-notice";
import { Tooltip } from "@/components/ui/tooltip";
import styles from "./message.module.css";
import { formatMessageTime } from "./message-time";

export function AgentReplyActions({
  text,
  disabled = false,
  timestamp,
  user = false,
}: {
  text: string;
  disabled?: boolean;
  timestamp?: Date | null;
  user?: boolean;
}) {
  const [copied, setCopied] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    []
  );
  if (!text.trim()) return null;
  return (
    <div
      className={`${styles.actions} mt-1 flex items-center gap-1 ${user ? "justify-end" : ""}`}
    >
      {timestamp ? (
        <time
          className="text-xs leading-5 text-muted"
          dateTime={timestamp.toISOString()}
        >
          {formatMessageTime(timestamp)}
        </time>
      ) : null}
      <button
        type="button"
        className="pressable inline-flex min-h-9 w-9 shrink-0 items-center justify-center p-0 rounded-lg text-muted transition-colors hover:text-ink focus-visible:text-ink disabled:pointer-events-none disabled:opacity-45"
        aria-label={user ? "Copy message" : "Copy reply"}
        disabled={disabled}
        onClick={async () => {
          try {
            await navigator.clipboard.writeText(text.trim());
            setCopied(true);
            if (timer.current) clearTimeout(timer.current);
            timer.current = setTimeout(() => setCopied(false), 2000);
          } catch {
            notify(
              "Couldn’t copy this message. Select the text and copy it manually."
            );
          }
        }}
      >
        {copied ? (
          <Check size={15} aria-hidden />
        ) : (
          <Copy size={15} aria-hidden />
        )}
        <Tooltip
          content={copied ? "Copied" : user ? "Copy message" : "Copy reply"}
          side="bottom"
          align="center"
        />
      </button>
      <span className="sr-only" role="status">
        {copied ? "Copied" : ""}
      </span>
    </div>
  );
}

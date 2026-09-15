"use client";
import { Check, Copy } from "@phosphor-icons/react";
import { useEffect, useRef, useState } from "react";
import { notify } from "@/components/ui/action-notice";
import { Tooltip } from "@/components/ui/tooltip";

export function AgentReplyActions({
  text,
  disabled = false,
}: {
  text: string;
  disabled?: boolean;
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
    <div className="mt-1 flex items-center">
      <button
        type="button"
        className="pressable inline-flex min-h-9 w-9 items-center justify-start p-0 rounded-lg text-muted transition-colors hover:text-ink focus-visible:text-ink disabled:pointer-events-none disabled:opacity-45"
        aria-label="Copy reply"
        disabled={disabled}
        onClick={async () => {
          try {
            await navigator.clipboard.writeText(text.trim());
            setCopied(true);
            if (timer.current) clearTimeout(timer.current);
            timer.current = setTimeout(() => setCopied(false), 2000);
          } catch {
            notify(
              "Couldn’t copy this reply. Select the text and copy it manually."
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
          content={copied ? "Copied" : "Copy reply"}
          side="bottom"
          align="start"
        />
      </button>
      <span className="sr-only" role="status">
        {copied ? "Copied" : ""}
      </span>
    </div>
  );
}

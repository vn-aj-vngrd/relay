"use client";

import { CaretDown, Plus } from "@phosphor-icons/react";
import type { ComponentProps, ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Tooltip } from "@/components/ui/tooltip";
import { AgentMark } from "./agent-mark";
import { AgentAnswer } from "./answer";
import styles from "./message.module.css";

export function AgentNewChatButton({
  onClick,
  disabled = false,
}: {
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <Button
      variant="quiet"
      aria-label="New chat"
      className="shrink-0 rounded-full bg-transparent! px-2! lg:px-3!"
      disabled={disabled}
      onClick={onClick}
    >
      <Plus size={16} aria-hidden />
      <span>New chat</span>
      <Tooltip content="New chat" side="bottom" />
    </Button>
  );
}

export function AgentMessage({
  user = false,
  text,
  beforeAnswer,
  children,
}: {
  user?: boolean;
  text: string;
  beforeAnswer?: ReactNode;
  children?: ReactNode;
}) {
  return (
    <article
      aria-label={user ? "You" : "Agent"}
      className={
        user
          ? `${styles.message} ml-auto w-fit min-w-0 max-w-[90%]`
          : `${styles.message} max-w-full pr-2`
      }
    >
      {!user ? (
        <div className="mb-2 flex items-center gap-2 text-sm font-semibold">
          <AgentMark size={18} className="text-primary" />
          Agent
        </div>
      ) : null}
      {beforeAnswer}
      <div
        className={
          user
            ? "ml-auto w-fit max-w-full rounded-2xl bg-surface-strong px-3.5 py-2"
            : undefined
        }
      >
        <AgentAnswer text={text} />
      </div>
      {children}
    </article>
  );
}

export function AgentEmptyState({ children }: { children?: ReactNode }) {
  return (
    <div className="mx-auto flex max-w-lg flex-col items-start justify-center py-10 sm:py-16">
      <AgentMark size={36} className="mb-5 text-primary" />
      <h2 className="text-2xl font-semibold tracking-tight">
        Your games, a little clearer.
      </h2>
      <p className="mt-3 text-sm leading-6 text-muted">
        Ask about games, groups and courts. Use + below to see what Agent can
        help you do.
      </p>
      {children}
    </div>
  );
}

export function AgentChatPickerTrigger({
  title,
  ...props
}: Omit<ComponentProps<"button">, "children"> & { title: string }) {
  return (
    <button
      type="button"
      className="pressable inline-flex min-h-9 max-w-full items-center gap-1.5 rounded-full bg-transparent px-3 text-[13px] font-medium disabled:opacity-45"
      {...props}
    >
      <span className="truncate py-0.5 leading-5">{title}</span>
      <Tooltip content={title} side="bottom" align="center" />
      <CaretDown size={13} className="shrink-0" aria-hidden />
    </button>
  );
}

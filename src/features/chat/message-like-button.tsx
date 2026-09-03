"use client";

import { ThumbsUp } from "@phosphor-icons/react";
import { useOptimistic, useState, useTransition } from "react";

import { toggleMessageReaction } from "./actions";

export function MessageLikeButton({
  messageId,
  slug,
  liked,
  count,
}: {
  messageId: string;
  slug?: string;
  liked: boolean;
  count: number;
}) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState("");
  const [optimistic, toggleOptimistic] = useOptimistic({ liked, count }, (current) => ({
    liked: !current.liked,
    count: Math.max(0, current.count + (current.liked ? -1 : 1)),
  }));

  function toggle() {
    setError("");
    startTransition(async () => {
      toggleOptimistic(undefined);
      const formData = new FormData();
      formData.set("messageId", messageId);
      if (slug) formData.set("slug", slug);
      try {
        await toggleMessageReaction(formData);
      } catch {
        setError("The like couldn’t be updated. Try again.");
      }
    });
  }

  return (
    <>
      <button
        type="button"
        aria-label={optimistic.liked ? "Remove like" : "Like message"}
        aria-pressed={optimistic.liked}
        aria-busy={pending || undefined}
        onClick={toggle}
        className={`pressable inline-flex min-h-7 items-center gap-1 rounded-md px-1.5 text-xs ${optimistic.liked ? "bg-primary-soft text-primary" : "text-muted hover:bg-surface-strong"}`}
      >
        <ThumbsUp aria-hidden size={13} weight={optimistic.liked ? "fill" : "regular"} />
        {optimistic.count || null}
      </button>
      <span aria-live="polite" className="sr-only">
        {error}
      </span>
    </>
  );
}

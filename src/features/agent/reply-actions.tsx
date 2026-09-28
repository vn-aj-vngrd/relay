"use client";
import {
  Check,
  CopySimple,
  ThumbsDown,
  ThumbsUp,
  X,
} from "@phosphor-icons/react";
import Link from "next/link";
import { type FormEvent, useEffect, useId, useRef, useState } from "react";
import { notify } from "@/components/ui/action-notice";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Tooltip } from "@/components/ui/tooltip";
import styles from "./message.module.css";
import { formatMessageTime } from "./message-time";
import { type AgentReplyRating, agentReplyReasons } from "./response-feedback";

export function AgentReplyActions({
  text,
  disabled = false,
  timestamp,
  user = false,
  conversationId,
  messageId,
  rating,
  alwaysVisible = false,
  onRatingSaved,
}: {
  text: string;
  disabled?: boolean;
  timestamp?: Date | null;
  user?: boolean;
  conversationId?: string | null;
  messageId?: string;
  rating?: AgentReplyRating;
  alwaysVisible?: boolean;
  onRatingSaved?: (messageId: string, rating: AgentReplyRating) => void;
}) {
  const [copied, setCopied] = useState(false);
  const [feedbackOpen, setFeedbackOpen] = useState(false);
  const [draftRating, setDraftRating] = useState<AgentReplyRating>("good");
  const [reasons, setReasons] = useState<string[]>([]);
  const [details, setDetails] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const dialog = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const detailsId = useId();
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    []
  );
  useEffect(() => {
    if (feedbackOpen) dialog.current?.showModal();
  }, [feedbackOpen]);

  function openFeedback(value: AgentReplyRating) {
    setDraftRating(value);
    setReasons([]);
    setDetails("");
    setError("");
    setFeedbackOpen(true);
  }

  async function submitFeedback(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!conversationId || !messageId || pending) return;
    setPending(true);
    setError("");
    try {
      const response = await fetch("/api/agent/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          conversationId,
          messageId,
          rating: draftRating,
          reasons,
          details,
        }),
      });
      if (!response.ok) {
        const body = (await response.json()) as { error?: string };
        throw new Error(body.error || "Couldn’t save feedback. Try again.");
      }
      onRatingSaved?.(messageId, draftRating);
      dialog.current?.close();
      notify("Thanks—your reply feedback was saved.");
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "Couldn’t save feedback. Try again."
      );
    } finally {
      setPending(false);
    }
  }

  if (!text.trim()) return null;
  return (
    <>
      <div
        className={`${styles.actions} ${alwaysVisible ? styles.visibleActions : ""} mt-1 flex items-center gap-0 ${user ? "justify-end" : ""}`}
      >
        {timestamp ? (
          <time
            className="mr-3 text-xs leading-5 text-muted"
            dateTime={timestamp.toISOString()}
          >
            {formatMessageTime(timestamp)}
          </time>
        ) : null}
        <button
          type="button"
          className="pressable inline-flex min-h-11 w-11 shrink-0 items-center justify-center rounded-lg p-0 text-muted transition-colors hover:text-ink focus-visible:text-ink disabled:pointer-events-none disabled:opacity-45"
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
            <Check size={20} aria-hidden />
          ) : (
            <CopySimple size={20} aria-hidden />
          )}
          <Tooltip
            content={copied ? "Copied" : user ? "Copy message" : "Copy reply"}
            side="bottom"
            align="center"
          />
        </button>
        {!user && !disabled && conversationId && messageId
          ? (["good", "bad"] as const).map((value) => {
              const Icon = value === "good" ? ThumbsUp : ThumbsDown;
              const label = value === "good" ? "Good response" : "Needs work";
              const selected = rating === value;
              return (
                <button
                  key={value}
                  type="button"
                  onClick={() => openFeedback(value)}
                  className={`pressable inline-flex min-h-11 w-11 shrink-0 items-center justify-center rounded-lg transition-colors hover:text-ink focus-visible:text-ink ${selected ? "text-primary" : "text-muted"}`}
                  aria-label={label}
                  aria-pressed={selected}
                >
                  <Icon
                    size={20}
                    weight={selected ? "fill" : "regular"}
                    aria-hidden
                  />
                  <Tooltip content={label} side="bottom" align="center" />
                </button>
              );
            })
          : null}
        <span className="sr-only" role="status">
          {copied ? "Copied" : ""}
        </span>
      </div>
      {feedbackOpen ? (
        <Dialog
          ref={dialog}
          aria-labelledby={titleId}
          onClose={() => setFeedbackOpen(false)}
          onDismiss={() => dialog.current?.close()}
          className="max-h-[calc(100dvh-2rem)] overflow-y-auto"
        >
          <form noValidate onSubmit={submitFeedback} className="p-5 sm:p-6">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 id={titleId} className="text-lg font-semibold">
                  Share reply feedback
                </h2>
                <p className="mt-1 text-sm leading-6 text-muted">
                  {draftRating === "good" ? "Good response" : "Needs work"} ·
                  Choose a reason or add details without sharing your chat
                  transcript.
                </p>
                {rating ? (
                  <p className="mt-1 text-xs leading-5 text-muted">
                    Submitting again replaces your previous rating.
                  </p>
                ) : null}
              </div>
              <Button
                type="button"
                size="icon"
                variant="quiet"
                aria-label="Close feedback"
                onClick={() => dialog.current?.close()}
              >
                <X size={18} aria-hidden />
              </Button>
            </div>
            <fieldset className="mt-5">
              <legend className="text-sm font-semibold">What stood out?</legend>
              <div className="mt-2 flex flex-wrap gap-2">
                {agentReplyReasons[draftRating].map((reason) => {
                  const selected = reasons.includes(reason.value);
                  return (
                    <button
                      key={reason.value}
                      type="button"
                      aria-pressed={selected}
                      onClick={() =>
                        setReasons((current) =>
                          selected
                            ? current.filter((value) => value !== reason.value)
                            : [...current, reason.value]
                        )
                      }
                      className={`pressable min-h-9 rounded-full border px-3 text-sm ${selected ? "border-primary bg-primary-soft text-primary" : "border-line text-muted hover:bg-surface-strong"}`}
                    >
                      {reason.label}
                    </button>
                  );
                })}
              </div>
            </fieldset>
            <label
              htmlFor={detailsId}
              className="mt-5 block text-sm font-semibold"
            >
              Details <span className="font-normal text-muted">(optional)</span>
            </label>
            <textarea
              id={detailsId}
              value={details}
              onChange={(event) => setDetails(event.target.value)}
              maxLength={1000}
              rows={3}
              placeholder="What should Agent keep or improve?"
              className="field mt-2"
            />
            <p className="mt-2 text-xs leading-5 text-muted">
              Choose a reason or add details. We save your rating, reasons and
              details, not the question or answer.
            </p>
            {error ? (
              <p role="alert" className="mt-3 text-sm text-danger">
                {error}
              </p>
            ) : null}
            <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
              <Link
                href="/feedback?area=agent"
                className="inline-flex min-h-10 items-center text-sm font-semibold text-primary hover:underline"
              >
                Report a problem
              </Link>
              <Button
                type="submit"
                disabled={
                  pending || (!reasons.length && details.trim().length < 10)
                }
              >
                {pending ? "Saving…" : "Submit feedback"}
              </Button>
            </div>
          </form>
        </Dialog>
      ) : null}
    </>
  );
}

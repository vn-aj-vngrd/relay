"use client";

import { ArrowCounterClockwise, Pause, Play } from "@phosphor-icons/react";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Tooltip } from "@/components/ui/tooltip";
import { defaultAgentLimits } from "@/features/agent/allowance";
import {
  AgentChatPickerTrigger,
  AgentEmptyState,
  AgentMessage,
  AgentNewChatButton,
} from "@/features/agent/chat-presentation";
import { AgentComposer } from "@/features/agent/composer";
import type { AgentComposerHandle } from "@/features/agent/composer-editor";
import { AgentReplyActions } from "@/features/agent/reply-actions";
import styles from "./agent-demo.module.css";

const examples = [
  {
    label: "My next game",
    question: "When is my next game, and who's joining?",
    answer:
      "Your next game is Saturday doubles at **7 PM**. Angelika, Dave and Charles are going. Jamie is waitlisted. The court booking still needs confirmation.",
    source: "Saturday doubles · Game details",
  },
  {
    label: "Who's joining?",
    question: "Who is joining Saturday doubles?",
    answer:
      "Angelika, Dave and Charles are going to Saturday doubles. Jamie is on the waitlist. Open the game to see the current roster before heading to the court.",
    source: "Saturday doubles · Players",
  },
  {
    label: "Open games",
    question: "Show open games tomorrow.",
    answer:
      "There are two open games tomorrow in this example: Morning rallies at 8 AM has 2 spots, and Sunset doubles at 6 PM has 1 spot. Check each game for its court and joining requirements.",
    source: "Open games · Tomorrow",
  },
  {
    label: "Nearby courts",
    question: "Find courts near me.",
    answer:
      "Which city or neighborhood would you like to play in? Tell me the area and I’ll look for courts in Relay’s directory.",
    source: "Court Finder · Search by city or neighborhood",
  },
];
const thinkingFrames = 12;
const charactersPerFrame = 8;

export function AgentDemo({
  messageLimit = defaultAgentLimits.freeMessages,
}: {
  messageLimit?: number;
}) {
  const root = useRef<HTMLElement>(null);
  const field = useRef<AgentComposerHandle>(null);
  const transcript = useRef<HTMLDivElement>(null);
  const started = useRef(false);
  const picker = useRef<HTMLDivElement>(null);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [selected, setSelected] = useState(0);
  const [frame, setFrame] = useState<number | null>(-1);
  const [playing, setPlaying] = useState(false);
  const [visible, setVisible] = useState(false);
  const [pageVisible, setPageVisible] = useState(true);
  const [reduced, setReduced] = useState(true);
  useEffect(() => {
    if (!pickerOpen) return;
    const dismiss = (event: PointerEvent) => {
      if (!picker.current?.contains(event.target as Node)) setPickerOpen(false);
    };
    document.addEventListener("pointerdown", dismiss);
    return () => document.removeEventListener("pointerdown", dismiss);
  }, [pickerOpen]);
  const example = examples[selected];
  const idle = frame === -1;
  const complete = frame === null;
  const questionFrames = Math.ceil(example.question.length / 3);
  const composing = frame !== null && frame >= 0 && frame < questionFrames;
  const thinking =
    frame !== null &&
    frame >= questionFrames &&
    frame < questionFrames + thinkingFrames;
  const draft = composing ? example.question.slice(0, (frame + 1) * 3) : "";
  const answer = complete
    ? example.answer
    : example.answer.slice(
        0,
        Math.max(0, frame - questionFrames - thinkingFrames) *
          charactersPerFrame
      );

  useEffect(() => {
    if (!window.matchMedia) {
      setFrame(null);
      return;
    }
    const preference = window.matchMedia("(prefers-reduced-motion: reduce)");
    function updatePreference() {
      setReduced(preference.matches);
      if (preference.matches) {
        setFrame(null);
        setPlaying(false);
      }
    }
    function updateVisibility() {
      setPageVisible(!document.hidden);
    }
    updatePreference();
    updateVisibility();
    preference.addEventListener("change", updatePreference);
    document.addEventListener("visibilitychange", updateVisibility);
    const observer =
      typeof IntersectionObserver === "undefined"
        ? null
        : new IntersectionObserver(
            ([entry]) => {
              setVisible(entry.isIntersecting);
              if (entry.isIntersecting && !started.current) {
                started.current = true;
                if (!preference.matches) {
                  setFrame(0);
                  setPlaying(true);
                }
              }
            },
            { threshold: 0.3 }
          );
    if (root.current) observer?.observe(root.current);
    if (!observer) setVisible(true);
    return () => {
      observer?.disconnect();
      preference.removeEventListener("change", updatePreference);
      document.removeEventListener("visibilitychange", updateVisibility);
    };
  }, []);

  useEffect(() => {
    if (
      !playing ||
      !visible ||
      !pageVisible ||
      reduced ||
      frame === null ||
      frame < 0
    )
      return;
    const timeout = window.setTimeout(() => {
      if (
        (frame - questionFrames - thinkingFrames) * charactersPerFrame >=
        example.answer.length
      ) {
        setFrame(null);
        setPlaying(false);
      } else setFrame(frame + 1);
    }, 55);
    return () => window.clearTimeout(timeout);
  }, [
    playing,
    visible,
    pageVisible,
    reduced,
    frame,
    example.answer,
    questionFrames,
  ]);

  useEffect(() => {
    if (transcript.current)
      transcript.current.scrollTop =
        idle || composing ? 0 : transcript.current.scrollHeight;
  }, [frame, selected, idle, composing]);

  function choose(index: number) {
    started.current = true;
    setPickerOpen(false);
    setSelected(index);
    setFrame(reduced ? null : 0);
    setPlaying(!reduced);
  }

  return (
    <figure
      ref={root}
      className="min-w-0 overflow-hidden rounded-xl border border-line bg-surface"
      aria-label="Interactive Agent demo"
    >
      <figcaption className="sr-only">
        Agent chat · Interactive demo with sample data
      </figcaption>
      <div className="px-4 pt-4 sm:px-6">
        <div className="flex min-h-10 items-center justify-between gap-3 border-b border-line pb-3">
          <div
            ref={picker}
            role="group"
            className="relative min-w-0"
            onBlur={(event) => {
              if (!event.currentTarget.contains(event.relatedTarget))
                setPickerOpen(false);
            }}
            onKeyDown={(event) => {
              if (event.key === "Escape") {
                setPickerOpen(false);
                picker.current?.querySelector("button")?.focus();
              }
            }}
          >
            <AgentChatPickerTrigger
              title={idle ? "Your chats" : example.label}
              aria-label="Choose sample chat"
              aria-expanded={pickerOpen}
              onClick={() => setPickerOpen(!pickerOpen)}
            />
            {pickerOpen ? (
              <div className="absolute left-0 top-full z-10 mt-1 max-h-60 w-64 max-w-[calc(100vw-6rem)] overflow-y-auto rounded-xl border border-line bg-surface p-1 shadow-md">
                {examples.map((item, index) => (
                  <button
                    key={item.label}
                    type="button"
                    className="block min-h-10 w-full truncate rounded-lg px-3 py-2 text-left text-sm hover:bg-surface-strong"
                    onClick={() => choose(index)}
                  >
                    {item.question}
                  </button>
                ))}
              </div>
            ) : null}
          </div>
          <AgentNewChatButton
            disabled={idle}
            onClick={() => {
              started.current = true;
              setPickerOpen(false);
              setFrame(-1);
              setPlaying(false);
            }}
          />
        </div>
        <div className="mx-auto max-w-lg">
          <div
            ref={transcript}
            className="agent-conversation-scroll h-[320px] overflow-y-auto overscroll-contain py-5 sm:h-[340px]"
            aria-hidden="true"
            inert
          >
            {idle || composing ? (
              <AgentEmptyState guidance="Choose a sample conversation below to see how Agent responds." />
            ) : (
              <>
                <div key={example.question} className={styles.question}>
                  <AgentMessage user text={example.question}>
                    <AgentReplyActions user text={example.question} />
                  </AgentMessage>
                </div>
                {thinking ? (
                  <p
                    className="text-shimmer mt-6 inline-block text-sm text-muted"
                    data-paused={!playing || !visible || !pageVisible}
                  >
                    Thinking…
                  </p>
                ) : (
                  <div className="mt-7">
                    <AgentMessage
                      text={
                        complete
                          ? `${example.answer}\n\n${example.source}`
                          : answer
                      }
                    >
                      {complete ? (
                        <AgentReplyActions text={example.answer} />
                      ) : null}
                    </AgentMessage>
                  </div>
                )}
              </>
            )}
          </div>
          <div aria-hidden="true" inert>
            <AgentComposer
              usage={{
                plan: "free",
                limit: messageLimit,
                used: 0,
                reserved: 0,
                remaining: messageLimit,
                resetsAt: "2026-10-01T00:00:00+08:00",
              }}
              field={field}
              input={draft}
              onChange={() => {}}
              onSubmit={() => {}}
              onStop={() => {}}
              available
              busy={thinking || (!idle && !composing && !complete)}
              responding={thinking || (!idle && !composing && !complete)}
            />
          </div>
          <p className="mt-2 text-center text-xs leading-5 text-muted">
            AI can make mistakes. Check sources and don’t share secrets.
          </p>
        </div>
        <noscript>
          <p className="text-sm leading-7">
            Sample answer: {example.question} {example.answer}
          </p>
        </noscript>
        <div
          className="sr-only"
          role="status"
          aria-live="polite"
          aria-atomic="true"
        >
          {complete
            ? `${example.question} ${example.answer}`
            : idle
              ? "Choose an example to see Agent respond."
              : composing
                ? "Typing an example question."
                : "Agent demo is answering the selected question."}
        </div>
      </div>
      <div className="mt-4 border-t border-line bg-canvas px-4 py-3 sm:px-6">
        <div
          className="flex flex-wrap gap-1"
          role="group"
          aria-label="Example questions"
        >
          {examples.map((item, index) => (
            <Button
              key={item.label}
              variant="quiet"
              aria-pressed={selected === index && !idle}
              onClick={() => choose(index)}
              className={
                selected === index && !idle
                  ? "text-ink underline underline-offset-4"
                  : "text-muted"
              }
            >
              {item.label}
            </Button>
          ))}
        </div>
        <div className="mt-2 flex items-center justify-between gap-2">
          <p className="text-xs leading-5 text-muted">
            Sample conversations · No messages used
          </p>
          {!reduced ? (
            <button
              type="button"
              className="pressable inline-flex size-9 shrink-0 items-center justify-center rounded-lg text-muted hover:text-ink"
              aria-label={
                idle
                  ? "Play demo"
                  : complete
                    ? "Replay demo"
                    : playing
                      ? "Pause demo"
                      : "Resume demo"
              }
              onClick={() =>
                complete || idle ? choose(selected) : setPlaying(!playing)
              }
            >
              {complete ? (
                <ArrowCounterClockwise size={16} aria-hidden />
              ) : playing ? (
                <Pause size={16} aria-hidden />
              ) : (
                <Play size={16} aria-hidden />
              )}
              <Tooltip
                content={
                  idle
                    ? "Play demo"
                    : complete
                      ? "Replay demo"
                      : playing
                        ? "Pause demo"
                        : "Resume demo"
                }
                side="top"
                align="center"
              />
            </button>
          ) : null}
        </div>
      </div>
    </figure>
  );
}

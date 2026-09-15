"use client";

import {
  ArrowCounterClockwise,
  ArrowUp,
  Pause,
  Play,
} from "@phosphor-icons/react";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { AgentMark } from "@/features/agent/agent-mark";
import styles from "./agent-demo.module.css";

const examples = [
  {
    label: "My next game",
    question: "When is my next game, and who's joining?",
    answer:
      "Your next game is Saturday doubles at 7 PM. Alex, Bea and Marco are going. Jamie is waitlisted. The court booking still needs confirmation.",
    source: "Saturday doubles · Game details",
  },
  {
    label: "Who's joining?",
    question: "Who is joining Saturday doubles?",
    answer:
      "Alex, Bea and Marco are going to Saturday doubles. Jamie is on the waitlist. Open the game to see the current roster before heading to the court.",
    source: "Saturday doubles · Players",
  },
  {
    label: "Open games",
    question: "Show open games tomorrow.",
    answer:
      "There are two open games tomorrow in this example: Morning rallies at 8 AM has 2 spots, and Sunset doubles at 6 PM has 1 spot. Check each game for its court and joining requirements.",
    source: "Open games · Tomorrow",
  },
];
const thinkingFrames = 12;
const charactersPerFrame = 8;

export function AgentDemo() {
  const root = useRef<HTMLElement>(null);
  const started = useRef(false);
  const [selected, setSelected] = useState(0);
  const [frame, setFrame] = useState<number | null>(-1);
  const [playing, setPlaying] = useState(false);
  const [visible, setVisible] = useState(false);
  const [pageVisible, setPageVisible] = useState(true);
  const [reduced, setReduced] = useState(true);
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

  function choose(index: number) {
    started.current = true;
    setSelected(index);
    setFrame(reduced ? null : 0);
    setPlaying(!reduced);
  }

  return (
    <figure
      ref={root}
      className="min-w-0 overflow-hidden rounded-xl border border-line bg-canvas"
      aria-label="Interactive Agent demo"
    >
      <figcaption className="flex items-center justify-between gap-3 border-b border-line px-5 py-4 sm:px-6">
        <span className="flex items-center gap-2 text-sm font-semibold">
          <AgentMark size={24} />
          Agent
        </span>
        <span className="text-xs text-muted">
          Interactive demo · Sample data
        </span>
      </figcaption>
      <div className="px-5 py-6 sm:px-6">
        <div
          className="mb-6 flex flex-wrap gap-2"
          role="group"
          aria-label="Example questions"
        >
          {examples.map((item, index) => (
            <Button
              key={item.label}
              variant="quiet"
              aria-pressed={selected === index}
              onClick={() => choose(index)}
              className={
                selected === index ? "bg-surface-strong text-ink" : "text-muted"
              }
            >
              {item.label}
            </Button>
          ))}
        </div>
        <div className="min-h-[290px] sm:min-h-[260px]" aria-hidden="true">
          {!idle && !composing ? (
            <p
              key={example.question}
              className={`${styles.question} ml-7 rounded-xl bg-surface-strong px-4 py-3 text-sm leading-6`}
            >
              {example.question}
            </p>
          ) : (
            <p className="h-14 text-right text-xs text-muted">
              A question about your next game
            </p>
          )}
          <div className="mb-3 mt-6 flex items-center gap-2 text-sm font-semibold">
            <AgentMark size={22} />
            Agent
          </div>
          <div className={styles.response}>
            {idle || composing ? (
              <p className="text-sm text-muted">
                {composing
                  ? "Waiting for your question…"
                  : "Choose an example below to start a conversation."}
              </p>
            ) : thinking ? (
              <p
                className="text-shimmer inline-block h-7 text-sm text-muted"
                data-paused={!playing || !visible || !pageVisible}
              >
                Checking the game details
              </p>
            ) : (
              <p className="text-sm leading-7">
                {answer}
                {!complete ? <span className={styles.caret} /> : null}
              </p>
            )}
            {complete ? (
              <p className="mt-4 text-xs font-medium text-muted">
                {example.source}
              </p>
            ) : null}
          </div>
          <div className={styles.reducedResponse}>
            <p className="text-sm leading-7">{example.answer}</p>
            <p className="mt-4 text-xs font-medium text-muted">
              {example.source}
            </p>
          </div>
          <div className="mt-6 flex min-h-12 items-center justify-between gap-3 rounded-xl border border-line bg-surface px-4 py-3 text-sm">
            <span className={draft ? "text-ink" : "text-muted"}>
              {draft || "Ask about your games…"}
              {composing ? <span className={styles.caret} /> : null}
            </span>
            <span className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-primary text-white">
              <ArrowUp size={16} />
            </span>
          </div>
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
        <div className="mt-4 flex items-center justify-between gap-3 border-t border-line pt-4">
          <p className="text-xs leading-5 text-muted">
            Illustrative game. No account data or messages used.
          </p>
          {!reduced ? (
            <Button
              variant="quiet"
              className="shrink-0"
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
              {idle
                ? "Play demo"
                : complete
                  ? "Replay demo"
                  : playing
                    ? "Pause demo"
                    : "Resume demo"}
            </Button>
          ) : null}
        </div>
      </div>
    </figure>
  );
}

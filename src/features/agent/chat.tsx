"use client";
import { useChat } from "@ai-sdk/react";
import { ArrowUp, Plus, Stop } from "@phosphor-icons/react";
import { TextStreamChatTransport } from "ai";
import { useEffect, useRef, useState } from "react";
import { notify } from "@/components/ui/action-notice";
import { Button } from "@/components/ui/button";
import { AgentMark } from "./agent-mark";
import type { AgentUsageSummary } from "./allowance";
import { AgentAnswer } from "./answer";
import { agentMessageMaxLength } from "./constants";
import { AgentUsageSummaryView } from "./usage-summary";

const suggestions = [
  "When is my next game?",
  "What games need my attention?",
  "Show open games tomorrow.",
  "How do I start a Quick Game?",
];
const transport = new TextStreamChatTransport({
  api: "/api/agent",
  fetch: async (input, init) => {
    const response = await fetch(input, init);
    if (!response.ok) throw new Error(`AGENT_HTTP_${response.status}`);
    return response;
  },
  prepareSendMessagesRequest: ({ messages }) => ({
    body: {
      requestId: crypto.randomUUID(),
      messages: messages
        .filter(
          (message) => message.role === "user" || message.role === "assistant"
        )
        .map((message) => ({
          role: message.role,
          content: message.parts
            .filter((part) => part.type === "text")
            .map((part) => part.text)
            .join("")
            .slice(0, agentMessageMaxLength),
        }))
        .filter((message) => message.content.trim())
        .slice(-24),
    },
  }),
});

export function AgentChat({
  available,
  unavailableReason = "Agent is not available yet. You can still browse your games and Help Center.",
  initialUsage = null,
}: {
  available: boolean;
  unavailableReason?: string;
  initialUsage?: AgentUsageSummary | null;
}) {
  const [usage, setUsage] = useState(initialUsage);
  const [input, setInput] = useState("");
  const {
    messages,
    sendMessage,
    status,
    error,
    stop,
    setMessages,
    clearError,
    regenerate,
  } = useChat({ transport });
  const viewport = useRef<HTMLDivElement>(null);
  const follow = useRef(true);
  const field = useRef<HTMLTextAreaElement>(null);
  const busy = status === "submitted" || status === "streaming";
  const errorCopy =
    error?.message === "AGENT_HTTP_402"
      ? "No Agent messages are currently available. If an answer is in progress, let it finish and retry. Otherwise, check Plan & billing for your reset date or options."
      : error?.message === "AGENT_HTTP_429"
        ? "You’ve reached Agent’s hourly limit. Try again later."
        : error?.message === "AGENT_HTTP_401" ||
            error?.message === "AGENT_HTTP_403"
          ? "Sign in with an active account to continue."
          : error?.message === "AGENT_HTTP_400"
            ? "Shorten your message or start a new chat."
            : "Agent couldn’t respond. Check your connection or try again later.";
  useEffect(() => {
    if (busy || !available) return;
    const controller = new AbortController();
    void fetch("/api/agent", { signal: controller.signal, cache: "no-store" })
      .then(async (response) => {
        if (response.ok) setUsage(await response.json());
      })
      .catch(() => {
        /* Preserve the last known usage on a transient error. */
      });
    return () => controller.abort();
  }, [busy, available]);
  useEffect(() => {
    if (follow.current && viewport.current)
      viewport.current.scrollTop = viewport.current.scrollHeight;
  }, [messages, status]);
  function limitInput(text: string) {
    if (text.length <= agentMessageMaxLength) return text;
    notify(
      "Messages can contain up to 4,000 characters. Extra text was removed; review your message before sending."
    );
    return text.slice(0, agentMessageMaxLength).replace(/[\uD800-\uDBFF]$/, "");
  }
  async function send(text: string) {
    if (text.length > agentMessageMaxLength) {
      setInput(limitInput(text));
      return;
    }
    if (!text.trim() || busy || !available) return;
    clearError();
    follow.current = true;
    setInput("");
    await sendMessage({ text: text.trim() });
  }
  return (
    <section
      aria-label="Agent chat"
      className="mx-auto flex h-[calc(100dvh-12rem)] min-h-[420px] max-w-3xl flex-col lg:h-[calc(100dvh-7rem)]"
    >
      <header className="flex shrink-0 items-center justify-between gap-4 border-b border-line pb-4">
        <div className="flex items-center gap-2.5">
          <AgentMark className="text-primary" />
          <h1 className="text-lg font-semibold">Agent</h1>
          <span className="text-xs text-muted">Read-only</span>
        </div>
        <Button
          variant="quiet"
          disabled={busy || !messages.length}
          onClick={() => {
            setMessages([]);
            clearError();
            setInput("");
            field.current?.focus();
          }}
        >
          <Plus size={16} aria-hidden />
          New chat
        </Button>
      </header>
      <div
        ref={viewport}
        onScroll={() => {
          const el = viewport.current;
          if (el)
            follow.current =
              el.scrollHeight - el.scrollTop - el.clientHeight < 80;
        }}
        className="min-h-0 flex-1 overflow-y-auto overscroll-contain py-6"
        role="log"
        aria-label="Conversation"
        aria-live="polite"
        aria-relevant="additions text"
        aria-busy={busy}
      >
        {messages.length ? (
          <div className="space-y-7">
            {messages.map((message) => (
              <article
                key={message.id}
                aria-label={message.role === "user" ? "You" : "Agent"}
                className={
                  message.role === "user"
                    ? "ml-auto w-fit min-w-0 max-w-[90%] rounded-xl bg-surface-strong px-4 py-3"
                    : "max-w-full pr-2"
                }
              >
                {message.role !== "user" ? (
                  <div className="mb-2 flex items-center gap-2 text-sm font-semibold">
                    <AgentMark size={18} className="text-primary" />
                    Agent
                  </div>
                ) : null}
                <AgentAnswer
                  text={message.parts
                    .filter((part) => part.type === "text")
                    .map((part) => part.text)
                    .join("")}
                />
              </article>
            ))}
          </div>
        ) : (
          <div className="mx-auto flex max-w-lg flex-col items-start justify-center py-10 sm:py-16">
            <AgentMark size={36} className="mb-5 text-primary" />
            <h2 className="text-2xl font-semibold tracking-tight">
              Your games, a little clearer.
            </h2>
            <p className="mt-3 text-sm leading-6 text-muted">
              Ask about your next game, who's joining, your groups, or how Relay
              works.
            </p>
            <div className="mt-7 flex w-full flex-col items-start gap-1">
              {suggestions.map((question) => (
                <button
                  key={question}
                  type="button"
                  disabled={!available}
                  onClick={() => {
                    void send(question);
                  }}
                  className="pressable min-h-11 rounded-lg px-3 py-2 text-left text-sm text-muted hover:bg-surface-strong hover:text-ink disabled:opacity-45"
                >
                  {question}
                </button>
              ))}
            </div>
          </div>
        )}
        {status === "submitted" ? (
          <p
            role="status"
            className="text-shimmer mt-5 inline-block text-sm text-muted"
          >
            Looking into your question…
          </p>
        ) : null}
      </div>
      <div className="shrink-0 pt-3">
        {usage ? <AgentUsageSummaryView usage={usage} /> : null}
        {!available ? (
          <p role="status" className="mb-3 text-sm text-muted">
            {unavailableReason}
          </p>
        ) : null}
        {error ? (
          <div
            role="alert"
            className="mb-3 flex flex-wrap items-center gap-3 text-sm"
          >
            <p className="text-danger">{errorCopy}</p>
            <Button
              variant="secondary"
              onClick={() => {
                clearError();
                void regenerate();
              }}
            >
              Retry
            </Button>
          </div>
        ) : null}
        <form
          noValidate
          onSubmit={(event) => {
            event.preventDefault();
            void send(input);
          }}
          className="rounded-xl border border-line bg-surface p-3 focus-within:border-primary"
        >
          <label htmlFor="agent-message" className="sr-only">
            Message Agent
          </label>
          <textarea
            ref={field}
            id="agent-message"
            value={input}
            onChange={(event) => setInput(limitInput(event.target.value))}
            onPaste={(event) => {
              const pasted = event.clipboardData.getData("text");
              const start = event.currentTarget.selectionStart;
              const end = event.currentTarget.selectionEnd;
              const next = input.slice(0, start) + pasted + input.slice(end);
              if (next.length > agentMessageMaxLength) {
                event.preventDefault();
                setInput(limitInput(next));
              }
            }}
            aria-describedby="agent-message-limit"
            maxLength={agentMessageMaxLength}
            rows={2}
            disabled={!available}
            placeholder="Ask Agent…"
            className="agent-composer-input w-full resize-none bg-transparent text-[15px] leading-6 outline-none placeholder:text-muted disabled:opacity-50"
            onKeyDown={(event) => {
              if (
                event.key === "Enter" &&
                !event.shiftKey &&
                !event.nativeEvent.isComposing
              ) {
                event.preventDefault();
                void send(input);
              }
            }}
          />
          <p
            id="agent-message-limit"
            className="mt-1 text-right text-xs tabular-nums text-muted"
          >
            {input.length.toLocaleString()} /{" "}
            {agentMessageMaxLength.toLocaleString()} characters
          </p>
          <div className="mt-2 flex items-center justify-between gap-3">
            <p className="text-xs text-muted">
              Insights and answers. No changes to your games.
            </p>
            {busy ? (
              <Button
                type="button"
                variant="secondary"
                aria-label="Stop response"
                onClick={() => {
                  void stop();
                }}
              >
                <Stop size={16} aria-hidden />
                Stop
              </Button>
            ) : (
              <Button
                type="submit"
                aria-label="Send message"
                disabled={!available || !input.trim()}
              >
                <ArrowUp size={18} aria-hidden />
              </Button>
            )}
          </div>
        </form>
        <p className="mt-2 text-center text-xs leading-5 text-muted">
          Answers can be mistaken. Check linked sources. Chats aren't saved by
          Relay.
          <br />
          Questions and relevant game data are sent to our AI provider. Don't
          share secrets.
        </p>
      </div>
    </section>
  );
}

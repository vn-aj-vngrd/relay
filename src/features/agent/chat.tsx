"use client";
import { Chat, useChat } from "@ai-sdk/react";
import { ArrowUp, Plus, Stop } from "@phosphor-icons/react";
import { TextStreamChatTransport, type UIMessage } from "ai";
import { useEffect, useRef, useState } from "react";
import { FocusedBackLink } from "@/components/shared/focused-mobile-header";
import { notify } from "@/components/ui/action-notice";
import { Button } from "@/components/ui/button";
import { Tooltip } from "@/components/ui/tooltip";
import { AgentMark } from "./agent-mark";
import type { AgentUsageSummary } from "./allowance";
import { AgentAnswer } from "./answer";
import { type AgentCapabilities, availableAgentPrompts } from "./capabilities";
import { AgentChatSkeleton } from "./chat-skeleton";
import {
  AgentComposerEditor,
  type AgentComposerHandle,
} from "./composer-editor";
import { agentMessageMaxLength } from "./constants";
import { AgentCreationCard, useCreationProposals } from "./creation-cards";
import { type CreationFlow, creationFlowLabels } from "./creation-model";
import {
  conversationMessages,
  createConversation,
  loadConversation,
  setConversationUrl,
} from "./history-client";
import { AgentHistoryPanel } from "./history-panel";
import {
  formatMessageTime,
  messageTimestamp,
  showMessageTime,
} from "./message-time";
import { AgentReplyActions } from "./reply-actions";
import type { AgentSession } from "./session";
import { useAgentSession } from "./session";
import { AgentUsageSummaryView } from "./usage-summary";

const loadingLabels = [
  "Thinking…",
  "Pondering…",
  "Considering…",
  "Working it through…",
  "Putting it together…",
  "Connecting the dots…",
];
const createTransport = (session: AgentSession) =>
  new TextStreamChatTransport({
    api: "/api/agent",
    fetch: async (input, init) => {
      const response = await fetch(input, init);
      if (!response.ok) throw new Error(`AGENT_HTTP_${response.status}`);
      return response;
    },
    prepareSendMessagesRequest: ({ messages, trigger }) => ({
      body: {
        requestId: crypto.randomUUID(),
        messageId: messages.findLast((message) => message.role === "user")?.id,
        retry: trigger === "regenerate-message",
        conversationId: session.conversationId ?? undefined,
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
  allowCourtSearch = false,
  capabilities,
  unavailableReason = "Agent is not available yet. You can still browse your games and Help Center.",
  initialUsage = null,
}: {
  available: boolean;
  allowCourtSearch?: boolean;
  capabilities?: AgentCapabilities;
  unavailableReason?: string;
  initialUsage?: AgentUsageSummary | null;
}) {
  const enabledCapabilities = capabilities ?? {
    allowGameData: true,
    allowCourtSearch,
    allowHelp: true,
    allowGameCreation: false,
    allowGroupCreation: false,
  };
  const [usage, setUsage] = useState(initialUsage);
  const [actionsOpen, setActionsOpen] = useState(false);
  const session = useAgentSession();
  const [chat] = useState(() => {
    session.chat ??= new Chat({ transport: createTransport(session) });
    return session.chat;
  });
  const [activeTitle, setActiveTitle] = useState(session.title);
  const [activeId, setActiveId] = useState(session.conversationId);
  const [preparing, setPreparing] = useState(false);
  const [pendingQuestion, setPendingQuestion] = useState<UIMessage | null>(
    null
  );
  const [restoring, setRestoring] = useState(true);
  const [remotePending, setRemotePending] = useState(false);
  const prepareLock = useRef(false);
  const preparation = useRef<{
    controller: AbortController;
    question: string;
    preserveDraft: boolean;
  } | null>(null);
  useEffect(
    () => () => {
      const pending = preparation.current;
      if (!pending) return;
      pending.controller.abort();
      if (!pending.preserveDraft) session.draft = pending.question;
      preparation.current = null;
    },
    [session]
  );
  const [input, setInput] = useState(session.draft);
  useEffect(() => {
    session.draft = input;
  }, [input, session]);
  const [loadingLabel, setLoadingLabel] = useState(loadingLabels[0]);
  const {
    messages,
    sendMessage,
    regenerate,
    status,
    error,
    stop,
    setMessages,
    clearError,
  } = useChat({ chat });
  const visibleMessages = pendingQuestion
    ? [...messages, pendingQuestion]
    : messages;
  const viewport = useRef<HTMLDivElement>(null);
  const follow = useRef(true);
  const [scrolling, setScrolling] = useState(false);
  const scrollTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(
    () => () => {
      if (scrollTimer.current) clearTimeout(scrollTimer.current);
    },
    []
  );
  const field = useRef<AgentComposerHandle>(null);
  const busy =
    status === "submitted" ||
    status === "streaming" ||
    preparing ||
    restoring ||
    remotePending;
  const {
    proposals,
    error: proposalError,
    reload: reloadProposals,
  } = useCreationProposals(activeId, busy, Boolean(capabilities));
  async function startCreation(flow: CreationFlow) {
    await send(
      `${creationFlowLabels[flow]}. Ask me one question at a time.`,
      true
    );
  }
  const errorCopy =
    error?.message === "AGENT_HTTP_402"
      ? "No Agent messages are currently available. If an answer is in progress, let it finish and retry. Otherwise, check Plan & billing for your reset date or options."
      : error?.message === "AGENT_HTTP_429"
        ? "You’ve reached Agent’s hourly limit. Try again later."
        : error?.message === "AGENT_HTTP_401" ||
            error?.message === "AGENT_HTTP_403"
          ? "Sign in with an active account to continue."
          : error?.message === "AGENT_HTTP_409"
            ? "This chat is busy or full. Wait for its reply, or start a new chat."
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
  function newConversation() {
    session.conversationId = null;
    session.title = "Your chats";
    setActiveTitle("Your chats");
    setRemotePending(false);
    session.draft = "";
    setConversationUrl(null);
    setActiveId(null);
    setMessages([]);
    clearError();
    setInput("");
    field.current?.focus();
  }
  async function openConversation(id: string) {
    setRestoring(true);
    try {
      const saved = await loadConversation(id);
      setMessages(conversationMessages(saved));
      session.conversationId = id;
      session.title = saved.title;
      setActiveTitle(saved.title);
      setActiveId(id);
      setRemotePending(saved.pending);
      clearError();
      setInput("");
      session.draft = "";
      setConversationUrl(id);
    } catch {
      notify("Couldn’t open this chat. Try again from History.");
    } finally {
      setRestoring(false);
    }
  }
  useEffect(() => {
    let cancelled = false;
    const id = new URL(window.location.href).searchParams.get("chat");
    if (
      !id ||
      (session.conversationId === id &&
        (chat.status === "submitted" || chat.status === "streaming"))
    ) {
      setRestoring(false);
      return;
    }
    void loadConversation(id)
      .then((saved) => {
        if (cancelled) return;
        if (session.conversationId !== id) {
          setInput("");
          session.draft = "";
        }
        session.conversationId = id;
        session.title = saved.title;
        setActiveTitle(saved.title);
        setActiveId(id);
        setRemotePending(saved.pending);
        setMessages(conversationMessages(saved));
      })
      .catch(() => {
        if (!cancelled)
          notify("Couldn’t restore this chat. Open History to try again.");
      })
      .finally(() => {
        if (!cancelled) setRestoring(false);
      });
    return () => {
      cancelled = true;
    };
  }, [session, setMessages, chat]);
  useEffect(() => {
    if (!remotePending || !activeId) return;
    let cancelled = false;
    const timer = window.setInterval(() => {
      void loadConversation(activeId)
        .then((saved) => {
          if (cancelled) return;
          setMessages(conversationMessages(saved));
          setRemotePending(saved.pending);
        })
        .catch(() => {
          if (!cancelled) {
            setRemotePending(false);
            notify(
              "Couldn’t refresh this reply. Reopen the chat from History."
            );
          }
        });
    }, 3000);
    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
  }, [activeId, remotePending, setMessages]);
  function limitInput(text: string) {
    if (text.length <= agentMessageMaxLength) return text;
    notify(
      "Messages can contain up to 4,000 characters. Extra text was removed; review your message before sending."
    );
    return text.slice(0, agentMessageMaxLength).replace(/[\uD800-\uDBFF]$/, "");
  }
  function chooseLoadingLabel() {
    const choices = loadingLabels.filter((label) => label !== loadingLabel);
    setLoadingLabel(choices[Math.floor(Math.random() * choices.length)]);
  }
  async function send(text: string, preserveDraft = false) {
    if (text.length > agentMessageMaxLength) {
      setInput(limitInput(text));
      return;
    }
    if (!text.trim() || busy || prepareLock.current || !available) return;
    prepareLock.current = true;
    const controller = new AbortController();
    preparation.current = { controller, question: text, preserveDraft };
    setPreparing(true);
    const createdAt = new Date().toISOString();
    setPendingQuestion({
      metadata: { createdAt },
      id: crypto.randomUUID(),
      role: "user",
      parts: [{ type: "text", text: text.trim() }],
    });
    chooseLoadingLabel();
    follow.current = true;
    if (!preserveDraft) setInput("");
    try {
      if (controller.signal.aborted) return;
      if (!session.conversationId) {
        const saved = await createConversation(text, controller.signal);
        if (controller.signal.aborted) return;
        session.conversationId = saved.id;
        session.title = saved.title;
        setActiveTitle(saved.title);
        setActiveId(saved.id);
        setConversationUrl(saved.id);
      }
    } catch {
      if (controller.signal.aborted) return;
      preparation.current = null;
      notify(
        preserveDraft
          ? "Couldn’t start this action. Your draft is unchanged; please try again."
          : "Couldn’t save this chat. Your question is still here; please try again."
      );
      setPreparing(false);
      setPendingQuestion(null);
      if (!preserveDraft) setInput(text);
      prepareLock.current = false;
      return;
    }
    // Preparation is cancellable while navigating; established streams remain
    // owned by the authenticated session and continue across page changes.
    preparation.current = null;
    setPreparing(false);
    setPendingQuestion(null);
    clearError();
    try {
      await sendMessage(
        { text: text.trim(), metadata: { createdAt } },
        undefined
      );
    } finally {
      prepareLock.current = false;
    }
  }
  return (
    <section
      aria-label="Agent chat"
      className="agent-chat-page mx-auto flex h-full min-h-0 w-full flex-col"
    >
      <header className="-mx-4 flex h-14 shrink-0 items-center justify-between gap-2 border-b border-line px-1 sm:-mx-8 sm:px-5 lg:mx-0 lg:h-auto lg:px-0 lg:pb-4">
        <div className="flex min-w-0 flex-1 items-center gap-1">
          <FocusedBackLink isAuthenticated className="lg:hidden" />
          <h1 className="sr-only">Agent conversation</h1>
          <AgentHistoryPanel
            disabled={busy}
            activeId={activeId}
            activeTitle={activeTitle}
            onSelect={openConversation}
          />
        </div>
        <Button
          variant="quiet"
          className="rounded-full bg-surface-strong!"
          disabled={busy || (!messages.length && !activeId)}
          onClick={newConversation}
        >
          <Plus size={16} aria-hidden />
          New chat
        </Button>
      </header>
      <div
        ref={viewport}
        tabIndex={0}
        data-scrolling={scrolling}
        onScroll={() => {
          setScrolling(true);
          if (scrollTimer.current) clearTimeout(scrollTimer.current);
          scrollTimer.current = setTimeout(() => setScrolling(false), 900);
          const el = viewport.current;
          if (el)
            follow.current =
              el.scrollHeight - el.scrollTop - el.clientHeight < 80;
        }}
        className="agent-conversation-scroll min-h-0 w-full flex-1 overflow-y-auto overscroll-contain py-4 lg:py-6"
        role="log"
        aria-label="Conversation"
        aria-live="polite"
        aria-relevant="additions text"
        aria-busy={busy}
      >
        <div className="mx-auto w-full max-w-3xl">
          {restoring ? (
            <AgentChatSkeleton />
          ) : visibleMessages.length ? (
            <div className="space-y-7">
              {visibleMessages.map((message, index) => (
                <div key={message.id}>
                  {showMessageTime(visibleMessages, index) ? (
                    <p className="mb-6 text-center text-xs leading-5 text-muted">
                      <time dateTime={messageTimestamp(message)?.toISOString()}>
                        {formatMessageTime(messageTimestamp(message)!)}
                      </time>
                    </p>
                  ) : null}
                  <article
                    aria-label={message.role === "user" ? "You" : "Agent"}
                    className={
                      message.role === "user"
                        ? "ml-auto w-fit min-w-0 max-w-[90%] rounded-2xl bg-surface-strong px-3.5 py-2"
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
                    {message.metadata &&
                    typeof message.metadata === "object" &&
                    "interrupted" in message.metadata &&
                    message.metadata.interrupted === true ? (
                      <p className="mt-2 text-xs text-muted">
                        This reply was interrupted. Ask a follow-up to continue.
                      </p>
                    ) : null}
                    {message.role === "assistant" ? (
                      <AgentReplyActions
                        text={message.parts
                          .filter((part) => part.type === "text")
                          .map((part) => part.text)
                          .join("")}
                        disabled={
                          status === "streaming" &&
                          index === messages.length - 1
                        }
                      />
                    ) : null}
                  </article>
                  {proposals
                    .filter(
                      (proposal) =>
                        proposal.messageId === message.id &&
                        proposal.status !== "cancelled"
                    )
                    .map((proposal) => (
                      <AgentCreationCard
                        onContinue={(prompt) => void send(prompt, true)}
                        key={proposal.id}
                        proposal={proposal}
                        disabled={busy || !available}
                        onChange={reloadProposals}
                      />
                    ))}
                </div>
              ))}
            </div>
          ) : proposals.some(
              (proposal) => proposal.status !== "cancelled"
            ) ? null : (
            <div className="mx-auto flex max-w-lg flex-col items-start justify-center py-10 sm:py-16">
              <AgentMark size={36} className="mb-5 text-primary" />
              <h2 className="text-2xl font-semibold tracking-tight">
                Your games, a little clearer.
              </h2>
              <p className="mt-3 text-sm leading-6 text-muted">
                Ask about games, groups and courts. Use + below to see what
                Agent can help you do.
              </p>
              <div className="mt-7 flex w-full flex-col items-start gap-1">
                {availableAgentPrompts(enabledCapabilities)
                  .filter((item) =>
                    [
                      "Create a game",
                      "Create a group",
                      "Find my next game",
                      "Find courts near me",
                      "Learn how Relay works",
                    ].includes(item.label)
                  )
                  .map((item) => (
                    <button
                      key={item.prompt}
                      type="button"
                      disabled={!available || busy}
                      onClick={() => {
                        if ("flow" in item) void startCreation(item.flow);
                        else void send(item.prompt);
                      }}
                      className="pressable min-h-11 rounded-lg px-3 py-2 text-left text-sm text-muted hover:bg-surface-strong hover:text-ink disabled:opacity-45"
                    >
                      {item.prompt}
                    </button>
                  ))}
              </div>
            </div>
          )}
          {proposals
            .filter(
              (proposal) =>
                proposal.status !== "cancelled" &&
                !visibleMessages.some(
                  (message) => message.id === proposal.messageId
                )
            )
            .map((proposal) => (
              <AgentCreationCard
                onContinue={(prompt) => void send(prompt, true)}
                key={proposal.id}
                proposal={proposal}
                disabled={busy || !available}
                onChange={reloadProposals}
              />
            ))}
          {status === "submitted" || preparing || remotePending ? (
            <p
              role="status"
              className="text-shimmer mt-5 inline-block text-sm text-muted"
            >
              {loadingLabel}
            </p>
          ) : null}
        </div>
      </div>
      <div className="mx-auto w-full max-w-3xl shrink-0 pt-3">
        {proposalError ? (
          <div
            role="alert"
            className="mb-3 flex items-center gap-2 text-sm text-muted"
          >
            <p>{proposalError}</p>
            <Button variant="quiet" onClick={reloadProposals}>
              Reload actions
            </Button>
          </div>
        ) : null}
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
              disabled={busy || !available}
              onClick={async () => {
                if (busy || prepareLock.current || !available) return;
                prepareLock.current = true;
                chooseLoadingLabel();
                follow.current = true;
                clearError();
                try {
                  await regenerate();
                } finally {
                  prepareLock.current = false;
                }
              }}
            >
              Retry
            </Button>
          </div>
        ) : null}
        <div className="relative">
          <form
            noValidate
            onSubmit={(event) => {
              event.preventDefault();
              void send(input);
            }}
            className="rounded-xl border border-line bg-surface p-3 focus-within:border-primary"
          >
            <AgentComposerEditor
              ref={field}
              capabilities={enabledCapabilities}
              onCreate={(flow) => void startCreation(flow)}
              onActionsOpenChange={setActionsOpen}
              value={input}
              onChange={setInput}
              onSubmit={(text) => {
                void send(text);
              }}
              disabled={!available || busy}
            />
            <div className="mt-2 flex items-center justify-between gap-3">
              <button
                type="button"
                aria-label="Actions"
                aria-expanded={actionsOpen}
                aria-haspopup="listbox"
                disabled={!available || busy}
                onClick={() => field.current?.openActions()}
                className={`pressable flex size-9 items-center justify-center rounded-full transition-colors motion-reduce:transition-none hover:bg-surface-strong hover:text-ink disabled:opacity-45 ${actionsOpen ? "bg-surface-strong text-ink" : "text-muted"}`}
              >
                <Plus size={18} aria-hidden />
                <Tooltip content="Actions" side="top" />
              </button>
              {status === "submitted" || status === "streaming" ? (
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
                  disabled={!available || busy || !input.trim()}
                >
                  <ArrowUp size={18} aria-hidden />
                </Button>
              )}
            </div>
          </form>
        </div>
        <p className="mt-2 text-center text-xs leading-5 text-muted">
          AI can make mistakes. Check sources and don’t share secrets.
        </p>
      </div>
    </section>
  );
}

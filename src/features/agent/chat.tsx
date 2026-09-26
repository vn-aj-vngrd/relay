"use client";
import { Chat, useChat } from "@ai-sdk/react";
import { DefaultChatTransport, type UIMessage } from "ai";
import { useCallback, useEffect, useRef, useState } from "react";
import { FocusedBackLink } from "@/components/shared/focused-mobile-header";
import { notify } from "@/components/ui/action-notice";
import { Button } from "@/components/ui/button";
import { AgentMark } from "./agent-mark";
import type { AgentUsageSummary } from "./allowance";
import { type AgentCapabilities, availableAgentPrompts } from "./capabilities";
import {
  AgentEmptyState,
  AgentMessage,
  AgentNewChatButton,
} from "./chat-presentation";
import { AgentChatSkeleton } from "./chat-skeleton";
import { AgentComposer } from "./composer";
import type { AgentComposerHandle } from "./composer-editor";
import { agentMessageMaxLength } from "./constants";
import { AgentCreationCard, useCreationProposals } from "./creation-cards";
import { type CreationFlow, creationFlowLabels } from "./creation-model";
import {
  conversationMessages,
  createConversation,
  historyRequest,
  loadConversation,
  loadConversationSummary,
  setConversationUrl,
} from "./history-client";
import { AgentHistoryPanel } from "./history-panel";
import type { AgentConversationSummary } from "./history-types";
import {
  formatMessageTime,
  messageTimestamp,
  showMessageTime,
} from "./message-time";
import { AgentReplyActions } from "./reply-actions";
import { AgentResponseError } from "./response-error";
import type { AgentSession } from "./session";
import { useAgentSession } from "./session";
import { agentTransportMessages } from "./transport-messages";
import { finishWork, messageWork } from "./work";
import { AgentWorkLog } from "./work-log";
import { ensureAgentUIStream } from "./work-stream";

const createTransport = (session: AgentSession) =>
  new DefaultChatTransport({
    headers: { "x-relay-agent-stream": "activity-v1" },
    api: "/api/agent",
    fetch: async (input, init) => {
      const response = await fetch(input, init);
      if (!response.ok) throw new Error(`AGENT_HTTP_${response.status}`);
      return ensureAgentUIStream(response);
    },
    prepareSendMessagesRequest: ({ messages, trigger }) => {
      const question = messages.findLast((message) => message.role === "user");
      const requestId =
        trigger !== "regenerate-message" &&
        question?.metadata &&
        typeof question.metadata === "object" &&
        "requestId" in question.metadata &&
        typeof question.metadata.requestId === "string"
          ? question.metadata.requestId
          : crypto.randomUUID();
      return {
        body: {
          requestId,
          messageId: question?.id,
          retry: trigger === "regenerate-message",
          conversationId: session.conversationId ?? undefined,
          messages: agentTransportMessages(messages, session.conversationId),
        },
      };
    },
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
  const session = useAgentSession();
  const [chat] = useState(() => {
    session.chat ??= new Chat({
      transport: createTransport(session),
      onError: () => {
        session.activity = "error";
        session.notify();
      },
      onFinish: ({ message, isAbort, isError, isDisconnect }) => {
        if (!session.chat) return;
        session.activity = isAbort
          ? "idle"
          : isError || isDisconnect
            ? "error"
            : "completed";
        session.notify();
        const work = messageWork(message);
        session.chat.messages = session.chat.messages.map((item) =>
          item.id === message.id
            ? {
                ...item,
                metadata: {
                  ...(typeof item.metadata === "object" ? item.metadata : {}),
                  createdAt:
                    messageTimestamp(message)?.toISOString() ??
                    new Date().toISOString(),
                  ...(work?.status === "working"
                    ? {
                        work: finishWork(
                          work,
                          isAbort
                            ? "stopped"
                            : isError || isDisconnect
                              ? "failed"
                              : "completed"
                        ),
                      }
                    : {}),
                },
              }
            : item
        );
      },
    });
    return session.chat;
  });
  const [activeTitle, setActiveTitle] = useState(session.title);
  const [activeId, setActiveId] = useState(session.conversationId);
  const [activeArchived, setActiveArchived] = useState(session.archived);
  const [accountWorking, setAccountWorking] = useState(false);
  const preparing = Boolean(session.preparation);
  const pendingQuestion = session.preparation?.question ?? null;
  const [restoring, setRestoring] = useState(() => {
    const id =
      typeof window === "undefined"
        ? null
        : new URL(window.location.href).searchParams.get("chat");
    return (
      Boolean(id && id !== session.conversationId) ||
      (!chat.messages.length && !session.preparation)
    );
  });
  const remotePending = session.remotePending;
  const setRemotePending = useCallback(
    (pending: boolean) => {
      if (session.remotePending === pending) return;
      session.remotePending = pending;
      session.notify();
    },
    [session]
  );
  const prepareLock = useRef(false);
  useEffect(() => {
    setActiveTitle(session.title);
    setActiveId(session.conversationId);
  }, [session, session.title, session.conversationId]);
  const [input, setInput] = useState(session.draft);
  useEffect(() => {
    session.draft = input;
  }, [input, session]);
  useEffect(() => {
    setInput(session.draft);
  }, [session, session.draft]);
  const [workStartedAt, setWorkStartedAt] = useState(Date.now);
  const {
    messages,
    sendMessage,
    regenerate,
    status,
    error,
    stop,
    setMessages,
    clearError,
  } = useChat({ chat, throttle: 50 });
  const visibleMessages = pendingQuestion
    ? [...messages, pendingQuestion]
    : messages;
  const viewport = useRef<HTMLDivElement>(null);
  const knownUpdatedAt = useRef<string | null>(null);
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
  useEffect(() => {
    let cancelled = false;
    const localWorkStarted = () => session.activity === "working";
    const refresh = () => {
      void historyRequest<{ conversations: AgentConversationSummary[] }>()
        .then((recent) => {
          if (!cancelled)
            setAccountWorking(
              recent.conversations.some((row) => row.status === "working")
            );
        })
        .catch(() => {});
      if (activeId)
        void loadConversationSummary(activeId)
          .then((saved) => {
            if (cancelled || session.conversationId !== activeId) return;
            const archived = Boolean(saved.archivedAt);
            session.archived = archived;
            setActiveArchived(archived);
            if (busy || localWorkStarted()) return;
            if (
              saved.status === "working" ||
              (typeof saved.updatedAt === "string" &&
                saved.updatedAt !== knownUpdatedAt.current)
            )
              setRemotePending(true);
          })
          .catch(() => {});
    };
    refresh();
    const timer = window.setInterval(refresh, 5000);
    window.addEventListener("focus", refresh);
    return () => {
      cancelled = true;
      window.clearInterval(timer);
      window.removeEventListener("focus", refresh);
    };
  }, [activeId, busy, session, setRemotePending]);
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
  }, [messages, status, proposals.length]);
  function resetConversation() {
    session.conversationId = null;
    knownUpdatedAt.current = null;
    session.archived = false;
    session.title = "Your chats";
    setActiveTitle("Your chats");
    setRemotePending(false);
    session.draft = "";
    setConversationUrl(null);
    setActiveId(null);
    setActiveArchived(false);
    setMessages([]);
    clearError();
    setInput("");
    field.current?.focus();
  }
  async function newConversation() {
    if (busy) return;
    try {
      const recent = await historyRequest<{
        conversations: AgentConversationSummary[];
      }>();
      if (recent.conversations.some((row) => row.status === "working")) {
        notify("Wait for Agent to finish before starting another chat.");
        return;
      }
      resetConversation();
    } catch {
      notify("Couldn’t check Agent’s progress. Please try again.");
    }
  }
  async function openConversation(id: string) {
    setRestoring(true);
    try {
      const saved = await loadConversation(id);
      setMessages(conversationMessages(saved));
      knownUpdatedAt.current = saved.updatedAt;
      session.conversationId = id;
      session.archived = Boolean(saved.archivedAt);
      session.title = saved.title;
      setActiveTitle(saved.title);
      setActiveId(id);
      setActiveArchived(Boolean(saved.archivedAt));
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
        (chat.messages.length > 0 || session.preparation))
    ) {
      if (!id && session.conversationId)
        setConversationUrl(session.conversationId);
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
        knownUpdatedAt.current = saved.updatedAt;
        session.archived = Boolean(saved.archivedAt);
        session.title = saved.title;
        setActiveTitle(saved.title);
        setActiveId(id);
        setActiveArchived(Boolean(saved.archivedAt));
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
  }, [session, setMessages, chat, setRemotePending]);
  useEffect(() => {
    if (!remotePending || !activeId) return;
    let cancelled = false;
    let notified = false;
    const refresh = () => {
      void loadConversation(activeId)
        .then((saved) => {
          if (cancelled || session.conversationId !== activeId) return;
          setMessages(conversationMessages(saved));
          knownUpdatedAt.current = saved.updatedAt;
          setRemotePending(saved.pending);
        })
        .catch(() => {
          if (!cancelled && !notified) {
            notified = true;
            notify(
              "Couldn’t refresh this reply. Reopen the chat from History."
            );
          }
        });
    };
    refresh();
    const timer = window.setInterval(refresh, 3000);
    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
  }, [activeId, remotePending, session, setMessages, setRemotePending]);
  function limitInput(text: string) {
    if (text.length <= agentMessageMaxLength) return text;
    notify(
      "Messages can contain up to 4,000 characters. Extra text was removed; review your message before sending."
    );
    return text.slice(0, agentMessageMaxLength).replace(/[\uD800-\uDBFF]$/, "");
  }
  async function send(text: string, preserveDraft = false) {
    if (text.length > agentMessageMaxLength) {
      setInput(limitInput(text));
      return;
    }
    if (
      !text.trim() ||
      busy ||
      accountWorking ||
      activeArchived ||
      prepareLock.current ||
      !available
    )
      return;
    prepareLock.current = true;
    const controller = new AbortController();
    const requestId = crypto.randomUUID();
    const createdAt = new Date().toISOString();
    const question: UIMessage = {
      metadata: { createdAt, requestId },
      id: crypto.randomUUID(),
      role: "user",
      parts: [{ type: "text", text: text.trim() }],
    };
    session.activity = "working";
    session.preparation = { controller, question };
    session.notify();
    setWorkStartedAt(Date.now());
    follow.current = true;
    if (!preserveDraft) {
      session.draft = "";
      setInput("");
    }
    try {
      if (controller.signal.aborted) return;
      if (!session.conversationId) {
        const saved = await createConversation(
          text,
          requestId,
          controller.signal
        );
        if (controller.signal.aborted) return;
        session.conversationId = saved.id;
        knownUpdatedAt.current = saved.updatedAt;
        session.archived = false;
        session.title = saved.title;
        setActiveTitle(saved.title);
        setActiveId(saved.id);
        setActiveArchived(false);
        setConversationUrl(saved.id);
        session.notify();
      }
    } catch {
      if (controller.signal.aborted) return;
      session.preparation = null;
      session.activity = "error";
      notify(
        preserveDraft
          ? "Couldn’t start this action. Your draft is unchanged; please try again."
          : "Couldn’t save this chat. Your question is still here; please try again."
      );
      if (!preserveDraft) {
        session.draft = text;
        setInput(text);
      }
      session.notify();
      prepareLock.current = false;
      return;
    }
    // The persistent SDK instance owns the request even if this page unmounts.
    clearError();
    try {
      const request = sendMessage(question, undefined);
      session.preparation = null;
      session.notify();
      await request;
    } finally {
      session.preparation = null;
      if (session.activity === "working") session.activity = "idle";
      session.notify();
      prepareLock.current = false;
    }
  }
  async function retryResponse() {
    if (
      busy ||
      accountWorking ||
      activeArchived ||
      prepareLock.current ||
      !available
    )
      return;
    prepareLock.current = true;
    setWorkStartedAt(Date.now());
    follow.current = true;
    clearError();
    try {
      session.activity = "working";
      session.notify();
      await regenerate();
    } finally {
      if (session.activity === "working") session.activity = "idle";
      session.notify();
      prepareLock.current = false;
    }
  }
  const lastMessage = visibleMessages.at(-1);
  const interactionsDisabled =
    busy || accountWorking || activeArchived || !available;
  return (
    <section
      aria-label="Agent chat"
      className="agent-chat-page mx-auto flex h-full min-h-0 w-full flex-col"
    >
      <header className="-mx-4 flex h-12 shrink-0 items-center justify-between gap-2 border-b border-line px-3 sm:-mx-8 sm:px-7 lg:mx-0 lg:h-auto lg:px-0 lg:pb-4">
        <div className="flex min-w-0 flex-1 items-center gap-1">
          <FocusedBackLink isAuthenticated className="lg:hidden" />
          <h1 className="sr-only">Agent conversation</h1>
          <AgentHistoryPanel
            disabled={busy}
            activeId={activeId}
            activeTitle={activeTitle}
            activeWorking={session.activity === "working"}
            onSelect={openConversation}
          />
        </div>
        <AgentNewChatButton
          disabled={busy || accountWorking || (!messages.length && !activeId)}
          onClick={() => void newConversation()}
        />
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
              {visibleMessages.map((message, index) => {
                const work = messageWork(message);
                const latest = index === visibleMessages.length - 1;
                const interrupted = Boolean(
                  message.metadata &&
                    typeof message.metadata === "object" &&
                    "interrupted" in message.metadata &&
                    message.metadata.interrupted === true
                );
                const failed = work?.status === "failed" || interrupted;
                const stopped = work?.status === "stopped";
                return (
                  <div key={message.id}>
                    {showMessageTime(visibleMessages, index) ? (
                      <p className="mb-6 text-center text-xs leading-5 text-muted">
                        <time
                          dateTime={messageTimestamp(message)?.toISOString()}
                        >
                          {formatMessageTime(messageTimestamp(message)!)}
                        </time>
                      </p>
                    ) : null}
                    <AgentMessage
                      user={message.role === "user"}
                      text={message.parts
                        .filter((part) => part.type === "text")
                        .map((part) => part.text)
                        .join("")}
                      beforeAnswer={
                        message.role === "assistant" && work ? (
                          <AgentWorkLog key={message.id} work={work} />
                        ) : null
                      }
                    >
                      {message.role === "assistant" &&
                      ((error && latest) || failed || stopped) ? (
                        <AgentResponseError
                          message={
                            error && latest
                              ? errorCopy
                              : stopped
                                ? "Response stopped."
                                : "This reply was interrupted. Try again to continue."
                          }
                          stopped={stopped && !error}
                          disabled={interactionsDisabled}
                          onRetry={latest ? retryResponse : undefined}
                        />
                      ) : null}
                      <AgentReplyActions
                        timestamp={messageTimestamp(message)}
                        user={message.role === "user"}
                        text={message.parts
                          .filter((part) => part.type === "text")
                          .map((part) => part.text)
                          .join("")}
                        disabled={
                          message.role === "assistant" &&
                          status === "streaming" &&
                          index === messages.length - 1
                        }
                      />
                    </AgentMessage>
                  </div>
                );
              })}
            </div>
          ) : proposals.some(
              (proposal) => proposal.status !== "cancelled"
            ) ? null : (
            <AgentEmptyState>
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
                      disabled={interactionsDisabled}
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
            </AgentEmptyState>
          )}
          {error && lastMessage?.role !== "assistant" ? (
            <article aria-label="Agent" className="mt-7 max-w-full pr-2">
              <div className="mb-2 flex items-center gap-2 text-sm font-semibold">
                <AgentMark size={18} className="text-primary" />
                Agent
              </div>
              <AgentResponseError
                message={errorCopy}
                disabled={interactionsDisabled}
                onRetry={retryResponse}
              />
            </article>
          ) : null}
          {(status === "submitted" || preparing) &&
          lastMessage?.role !== "assistant" ? (
            <div className="mt-5">
              <AgentWorkLog
                work={{
                  startedAt:
                    messageTimestamp(pendingQuestion ?? undefined)?.getTime() ??
                    workStartedAt,
                  status: "working",
                  entries: [{ step: "reviewing", status: "running" }],
                }}
              />
            </div>
          ) : remotePending ? (
            <p role="status" className="mt-5 text-sm text-muted">
              Agent is working in another session. Waiting for the saved reply…
            </p>
          ) : null}
          {proposals
            .filter((proposal) => proposal.status !== "cancelled")
            .map((proposal) => (
              <AgentCreationCard
                onContinue={(prompt) => void send(prompt, true)}
                key={proposal.id}
                proposal={proposal}
                disabled={interactionsDisabled}
                onChange={reloadProposals}
              />
            ))}
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
        {!available ? (
          <p role="status" className="mb-3 text-sm text-muted">
            {unavailableReason}
          </p>
        ) : null}
        {activeArchived ? (
          <p role="status" className="mb-3 text-sm text-muted">
            This chat is archived. Restore it from Chat history to continue.
          </p>
        ) : null}
        {accountWorking && !busy && !activeArchived ? (
          <p role="status" className="mb-3 text-sm text-muted">
            Agent is replying in another chat. Wait for it to finish.
          </p>
        ) : null}

        <div className="relative">
          <AgentComposer
            field={field}
            input={input}
            onChange={setInput}
            onSubmit={(text) => void send(text)}
            onCreate={(flow) => void startCreation(flow)}
            onStop={() => {
              session.activity = "idle";
              session.notify();
              void stop();
            }}
            available={available && !activeArchived && !accountWorking}
            busy={busy}
            responding={status === "submitted" || status === "streaming"}
            capabilities={enabledCapabilities}
            usage={usage}
          />
        </div>
        <p className="mt-2 text-center text-xs leading-5 text-muted">
          AI can make mistakes. Check sources and don’t share secrets.
        </p>
      </div>
    </section>
  );
}

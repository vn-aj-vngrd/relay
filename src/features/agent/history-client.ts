import type { UIMessage } from "ai";
import { agentChatTitle } from "./chat-title";
import type {
  AgentConversation,
  AgentConversationSummary,
} from "./history-types";

export async function historyRequest<T>(
  path = "",
  init?: RequestInit
): Promise<T> {
  const response = await fetch(`/api/agent/conversations${path}`, {
    ...init,
    cache: "no-store",
    headers: { "Content-Type": "application/json", ...init?.headers },
  });
  if (!response.ok)
    throw new Error(
      response.status === 404
        ? "Chat not found. It may have been deleted."
        : "Couldn’t load or save chat history. Please try again."
    );
  return response.json() as Promise<T>;
}
export const loadConversation = (id: string) =>
  historyRequest<AgentConversation>(`/${encodeURIComponent(id)}`);
export const loadConversationSummary = (id: string) =>
  historyRequest<AgentConversationSummary>(
    `/${encodeURIComponent(id)}?summary=true`
  );
export const createConversation = (
  prompt: string,
  requestId: string,
  signal?: AbortSignal
) =>
  historyRequest<AgentConversationSummary>("", {
    method: "POST",
    signal,
    body: JSON.stringify({ title: agentChatTitle(prompt), requestId }),
  });
export function setConversationUrl(id: string | null) {
  const url = new URL(window.location.href);
  if (url.pathname !== "/agent") return;
  if (id) url.searchParams.set("chat", id);
  else url.searchParams.delete("chat");
  window.history.replaceState(window.history.state, "", url);
}

export function conversationMessages(saved: AgentConversation): UIMessage[] {
  return saved.messages.map((message) => ({
    id: message.id,
    role: message.role,
    metadata: {
      interrupted: message.interrupted === true,
      ...(message.work ? { work: message.work } : {}),
      ...(message.createdAt ? { createdAt: message.createdAt } : {}),
    },
    parts: [{ type: "text", text: message.content }],
  }));
}

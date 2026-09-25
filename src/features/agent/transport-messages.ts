import type { UIMessage } from "ai";
import { agentMessageMaxLength } from "./constants";

export function agentTransportMessages(
  messages: UIMessage[],
  conversationId: string | null
) {
  // Saved conversations are rebuilt from owner-scoped history on the server.
  // Retry may include a partial assistant reply; send the latest user prompt.
  const latest = messages.findLast((message) => message.role === "user");
  const selected = conversationId ? (latest ? [latest] : []) : messages;
  return selected
    .filter(
      (message) => message.role === "user" || message.role === "assistant"
    )
    .map((message) => ({
      role: message.role as "user" | "assistant",
      content: message.parts
        .filter((part) => part.type === "text")
        .map((part) => part.text)
        .join("")
        .slice(0, agentMessageMaxLength),
    }))
    .filter((message) => message.content.trim())
    .slice(-24);
}

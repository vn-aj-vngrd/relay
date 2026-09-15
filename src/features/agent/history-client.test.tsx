import { describe, expect, it } from "vitest";
import { conversationMessages, setConversationUrl } from "./history-client";
import { messageTimestamp, showMessageTime } from "./message-time";

describe("restored conversation metadata", () => {
  it("preserves recorded timestamps without inventing dates for older messages", () => {
    const messages = conversationMessages({
      id: "chat",
      title: "Courts",
      updatedAt: "2026-09-16T03:00:00Z",
      pending: false,
      messages: [
        { id: "old", role: "user", content: "Hello" },
        {
          id: "new",
          role: "user",
          content: "Find courts",
          createdAt: "2026-09-16T03:00:00Z",
        },
      ],
    });
    expect(messageTimestamp(messages[0])).toBeNull();
    expect(showMessageTime(messages, 0)).toBe(false);
    expect(messageTimestamp(messages[1])?.toISOString()).toBe(
      "2026-09-16T03:00:00.000Z"
    );
    expect(showMessageTime(messages, 1)).toBe(true);
  });
  it("only changes the selected chat URL on the Agent page", () => {
    window.history.replaceState(null, "", "/games?tab=upcoming");
    setConversationUrl("chat");
    expect(window.location.pathname + window.location.search).toBe(
      "/games?tab=upcoming"
    );
    window.history.replaceState(null, "", "/agent");
    setConversationUrl("chat");
    expect(window.location.search).toBe("?chat=chat");
    setConversationUrl(null);
    expect(window.location.search).toBe("");
  });
});

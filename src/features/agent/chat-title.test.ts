import { describe, expect, it } from "vitest";
import { agentChatTitle } from "./chat-title";
import { chatAge } from "./history-age";

describe("chat naming", () => {
  it("names a chat from its first message without Markdown decoration", () => {
    expect(agentChatTitle("  **find courts** in Cebu City.\n")).toBe(
      "Find courts in Cebu City."
    );
    expect(agentChatTitle("Explain [this game](/games/example)")).toBe(
      "Explain this game"
    );
    expect(agentChatTitle("x".repeat(100))).toHaveLength(80);
    expect(agentChatTitle("x".repeat(100))).toMatch(/…$/);
  });
  it("shows compact relative ages", () => {
    const now = Date.parse("2026-09-15T12:00:00Z");
    expect(chatAge("2026-09-04T12:00:00Z", now)).toBe("1w");
    expect(chatAge("2026-09-15T08:00:00Z", now)).toBe("4h");
  });
});

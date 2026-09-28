import { describe, expect, it } from "vitest";
import {
  type AgentReplyFeedbackInput,
  agentReplyFeedbackDescription,
  agentReplyFeedbackSchema,
} from "./response-feedback";

const base = {
  conversationId: "d6bb8798-b1a1-433f-8db5-0d585d5cb9e5",
  messageId: "reply-a",
  rating: "bad" as const,
  reasons: ["incorrect"],
  details: "",
} satisfies AgentReplyFeedbackInput;

describe("Agent reply feedback", () => {
  it("accepts a selected reason or useful details", () => {
    expect(agentReplyFeedbackSchema.safeParse(base).success).toBe(true);
    expect(
      agentReplyFeedbackSchema.safeParse({
        ...base,
        reasons: [],
        details: "The answer named the wrong venue.",
      }).success
    ).toBe(true);
    expect(agentReplyFeedbackDescription(base)).toBe(
      "Reasons: Incorrect details"
    );
  });

  it("rejects empty, mismatched, duplicate and oversized feedback", () => {
    for (const input of [
      { ...base, reasons: [], details: "" },
      { ...base, reasons: ["answered"] },
      { ...base, reasons: ["incorrect", "incorrect"] },
      { ...base, details: "x".repeat(1001) },
      { ...base, messageId: "x".repeat(121) },
      { ...base, transcript: "private content" },
    ]) {
      expect(agentReplyFeedbackSchema.safeParse(input).success).toBe(false);
    }
  });
});

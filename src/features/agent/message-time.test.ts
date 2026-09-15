import type { UIMessage } from "ai";
import { describe, expect, it } from "vitest";
import {
  formatMessageTime,
  messageTimestamp,
  showMessageTime,
} from "./message-time";

const message = (
  date?: Date,
  role: "user" | "assistant" = "user"
): UIMessage => ({
  id: String(date),
  role,
  parts: [{ type: "text", text: "Hi" }],
  metadata: date ? { createdAt: date.toISOString() } : {},
});
describe("Agent conversation timestamp separators", () => {
  it("shows the first question and repeats only after a 30-minute gap", () => {
    const start = new Date(2026, 8, 16, 12);
    const first = message(start);
    expect(showMessageTime([first], 0)).toBe(true);
    expect(
      showMessageTime([first, message(new Date(+start + 29 * 60000))], 1)
    ).toBe(false);
    expect(
      showMessageTime([first, message(new Date(+start + 30 * 60000))], 1)
    ).toBe(true);
    expect(
      showMessageTime(
        [first, message(new Date(+start + 60 * 60000), "assistant")],
        1
      )
    ).toBe(false);
  });
  it("separates a new local day even without a long gap", () => {
    expect(
      showMessageTime(
        [
          message(new Date(2026, 8, 15, 23, 59)),
          message(new Date(2026, 8, 16, 0, 1)),
        ],
        1
      )
    ).toBe(true);
  });
  it("uses readable dates and does not invent timestamps for legacy messages", () => {
    const now = new Date(2026, 8, 16, 23, 50);
    expect(formatMessageTime(new Date(2026, 8, 16, 23, 42), now)).toBe(
      "Today 11:42 PM"
    );
    expect(formatMessageTime(new Date(2026, 8, 15, 8, 10), now)).toBe(
      "Yesterday 8:10 AM"
    );
    expect(formatMessageTime(new Date(2025, 8, 15, 8, 10), now)).toBe(
      "Sep 15, 2025 8:10 AM"
    );
    expect(messageTimestamp(message())).toBeNull();
    expect(showMessageTime([message()], 0)).toBe(false);
  });
});

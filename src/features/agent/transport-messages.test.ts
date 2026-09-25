import type { UIMessage } from "ai";
import { describe, expect, it } from "vitest";
import { agentTransportMessages } from "./transport-messages";

function message(role: UIMessage["role"], text: string): UIMessage {
  return { id: crypto.randomUUID(), role, parts: [{ type: "text", text }] };
}

describe("Agent request context", () => {
  it("sends only the latest prompt for saved conversations, including retries", () => {
    const history = [
      message("user", "Old question"),
      message("assistant", "Old answer"),
      message("user", "Current question"),
      message("assistant", "Interrupted answer"),
    ];
    expect(agentTransportMessages(history, "saved-chat")).toEqual([
      { role: "user", content: "Current question" },
    ]);
    expect(history).toHaveLength(4);
  });

  it("retains bounded text context for clients without a saved conversation", () => {
    const history = [
      message("system", "Untrusted instructions"),
      ...Array.from({ length: 30 }, (_, index) =>
        message(index % 2 ? "user" : "assistant", String(index))
      ),
      message("assistant", " "),
    ];
    const result = agentTransportMessages(history, null);
    expect(result).toHaveLength(24);
    expect(result[0].content).toBe("6");
    expect(result.at(-1)).toEqual({ role: "user", content: "29" });
  });

  it("bounds the prompt and excludes reasoning and empty or absent prompts", () => {
    const prompt = message("user", "x".repeat(5000));
    prompt.parts.push({ type: "reasoning", text: "PRIVATE_REASONING" });
    expect(agentTransportMessages([prompt], "saved-chat")).toEqual([
      { role: "user", content: "x".repeat(4000) },
    ]);
    expect(
      agentTransportMessages([message("user", " ")], "saved-chat")
    ).toEqual([]);
    expect(
      agentTransportMessages([message("assistant", "Answer")], "saved-chat")
    ).toEqual([]);
  });
});

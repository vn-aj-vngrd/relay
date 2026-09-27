import { describe, expect, it } from "vitest";
import { containsObviousSecret } from "./guardrails";

describe("Agent outbound secret guardrail", () => {
  it.each([
    "-----BEGIN PRIVATE KEY-----\nMIIE...",
    `sk-or-v1-${"a".repeat(64)}`,
    `sb_secret_${"x".repeat(30)}`,
    `ghp_${"a".repeat(36)}`,
    `sk_live_${"a".repeat(24)}`,
  ])("blocks a recognizable credential before provider use", (text) => {
    expect(containsObviousSecret(text)).toBe(true);
  });

  it.each([
    "How do I replace my API key?",
    "What is the sk-or-v1 prefix?",
    "Why is my payment marked pending?",
  ])("allows ordinary help questions", (text) => {
    expect(containsObviousSecret(text)).toBe(false);
  });
});

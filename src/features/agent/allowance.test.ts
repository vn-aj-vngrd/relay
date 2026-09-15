import { describe, expect, it } from "vitest";
import { manilaMonth, resolveAllowance } from "@/features/billing/domain";
import {
  agentMessageLimit,
  defaultAgentLimits,
  summarizeAgentUsage,
} from "./allowance";

describe("monthly Agent entitlements", () => {
  it("uses the configured tier allowance and keeps Unlimited hosting metered", () => {
    expect(
      (["free", "plus", "pro", "unlimited"] as const).map((plan) =>
        agentMessageLimit(plan, defaultAgentLimits)
      )
    ).toEqual([50, 250, 750, 750]);
    expect(
      agentMessageLimit("plus", { ...defaultAgentLimits, plusMessages: 123 })
    ).toBe(123);
    expect(
      agentMessageLimit("free", { ...defaultAgentLimits, freeMessages: 0 })
    ).toBe(0);
  });
  it("includes pending reservations when deciding whether another request fits", () => {
    expect(
      summarizeAgentUsage(
        { plan: "free", end: new Date("2026-10-01") },
        defaultAgentLimits,
        49,
        1
      )
    ).toMatchObject({ remaining: 0, used: 49, reserved: 1 });
    expect(
      summarizeAgentUsage(
        { plan: "free", end: new Date("2026-10-01") },
        { ...defaultAgentLimits, freeMessages: 10 },
        20,
        0
      ).remaining
    ).toBe(0);
  });
  it("uses Free's Philippine calendar month and the paid term's existing usage window", () => {
    const now = new Date("2026-09-15T10:00:00Z");
    const free = resolveAllowance({ now });
    expect(free.end).toEqual(manilaMonth(now).end);
    const term = {
      planVersion: "plus-v2",
      startsAt: new Date("2026-09-10T16:00:00Z"),
      endsAt: new Date("2026-10-10T16:00:00Z"),
      usageStartsAt: free.start,
      games: 40,
      storageBytes: 100,
    };
    const paid = resolveAllowance({ now, term });
    const summary = summarizeAgentUsage(paid, defaultAgentLimits, 42, 0);
    expect(paid.start).toEqual(free.start);
    expect(summary).toMatchObject({
      plan: "plus",
      limit: 250,
      used: 42,
      remaining: 208,
      resetsAt: term.endsAt.toISOString(),
    });
  });
});

it("returns to the current Free window on expiry without erasing prior usage", () => {
  const now = new Date("2026-10-15T10:00:00Z");
  const allowance = resolveAllowance({
    now,
    term: {
      planVersion: "pro-v2",
      startsAt: new Date("2026-09-10"),
      endsAt: new Date("2026-10-10"),
      usageStartsAt: new Date("2026-09-01"),
      games: 100,
      storageBytes: 100,
    },
  });
  expect(allowance.plan).toBe("free");
  expect(allowance.start).toEqual(manilaMonth(now).start);
  expect(
    summarizeAgentUsage(allowance, defaultAgentLimits, 70, 0)
  ).toMatchObject({ limit: 50, used: 70, remaining: 0 });
});

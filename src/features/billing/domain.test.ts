import { describe, expect, it } from "vitest";

import {
  MiB,
  manilaDay,
  manilaMonth,
  mediaPolicy,
  nextBillingMonth,
  plans,
  renewalPeriod,
  resolveAllowance,
  transactionKey,
} from "./domain";

const now = new Date("2026-06-15T04:00:00Z");
const term = {
  startsAt: now,
  endsAt: new Date("2026-07-15T04:00:00Z"),
  usageStartsAt: new Date("2026-05-31T16:00:00Z"),
  games: 30,
  storageBytes: 2048 * MiB,
};

describe("personal subscription policy", () => {
  it("offers five Free games and thirty Pro games for PHP 299", () => {
    expect(plans.free).toMatchObject({
      games: 5,
      storageBytes: 100 * MiB,
      priceCents: 0,
    });
    expect(plans.pro).toMatchObject({
      games: 30,
      storageBytes: 2048 * MiB,
      priceCents: 29900,
    });
    expect(mediaPolicy.chat).toMatchObject({ maxBytes: MiB, dailyUploads: 10 });
    expect(mediaPolicy.memory).toMatchObject({
      maxBytes: 2 * MiB,
      dailyUploads: 20,
    });
  });
  it("resets Free at Philippine midnight, not UTC midnight", () => {
    expect(manilaMonth(new Date("2026-06-30T16:00:00Z"))).toEqual({
      start: new Date("2026-06-30T16:00:00Z"),
      end: new Date("2026-07-31T16:00:00Z"),
    });
    expect(manilaDay(new Date("2026-06-15T17:00:00Z"))).toEqual(
      new Date("2026-06-15T16:00:00Z")
    );
  });
  it.each([
    ["2026-01-31T04:12:00Z", "2026-02-28T04:12:00Z"],
    ["2028-01-31T04:12:00Z", "2028-02-29T04:12:00Z"],
    ["2026-12-31T15:30:00Z", "2027-01-31T15:30:00Z"],
  ])("clamps calendar month %s to %s", (start, end) =>
    expect(nextBillingMonth(new Date(start))).toEqual(new Date(end))
  );
  it("extends early renewals without discarding remaining access", () =>
    expect(renewalPeriod(now, term.endsAt)).toEqual({
      start: term.endsAt,
      end: new Date("2026-08-15T04:00:00Z"),
    }));
  it("starts expired renewals on approval", () =>
    expect(renewalPeriod(now, new Date("2026-01-01"))).toEqual({
      start: now,
      end: term.endsAt,
    }));
  it("defaults to Free", () =>
    expect(resolveAllowance({ now })).toMatchObject({
      plan: "free",
      games: 5,
      gamesOverridden: false,
    }));
  it("carries calendar-month creation usage into a new Pro term", () =>
    expect(resolveAllowance({ now, term }).start).toEqual(term.usageStartsAt));
  it("does not activate a future paid term", () =>
    expect(
      resolveAllowance({ now: new Date(now.getTime() - 1), term }).plan
    ).toBe("free"));
  it("expires access exactly at the boundary without a background job", () =>
    expect(resolveAllowance({ now: term.endsAt, term })).toMatchObject({
      plan: "free",
      games: 5,
      start: new Date("2026-06-30T16:00:00Z"),
    }));
  it("resolves overrides per field, including zero", () =>
    expect(
      resolveAllowance({
        now,
        term,
        override: { games: 0, storageBytes: null, expiresAt: null },
      })
    ).toMatchObject({
      games: 0,
      storageBytes: term.storageBytes,
      gamesOverridden: true,
      storageOverridden: false,
    }));
  it("ignores expired overrides", () =>
    expect(
      resolveAllowance({
        now,
        term,
        override: { games: 100, storageBytes: 1, expiresAt: now },
      })
    ).toMatchObject({ games: 30, storageBytes: term.storageBytes }));
  it("normalizes transaction references to detect duplicate credit", () =>
    expect(transactionKey(" GCash ", "ab-12 34")).toBe(
      transactionKey("gcash", "AB1234")
    ));
});

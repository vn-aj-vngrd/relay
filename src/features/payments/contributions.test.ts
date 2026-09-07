import { describe, expect, it } from "vitest";
import {
  collectionPlayerPrice,
  collectionShares,
  hasPaymentHistory,
} from "./domain";
import {
  collectionSetupValues,
  paymentSetupInput,
  paymentSetupSchema,
} from "./setup";

const fixed = {
  contributionMode: "fixed" as const,
  fixedRateCents: 30025,
  totalCents: 120000,
};
const setup = {
  label: "Game expenses",
  total: "1500",
  method: "GCash",
  details: "Host account",
};

describe("collection contributions", () => {
  it("states a fixed price before anyone joins and preserves it after discounts", () => {
    expect(collectionPlayerPrice([fixed], [])).toBe(30025);
    expect(
      collectionPlayerPrice([fixed], [{ sessionPlayerId: "a", amountCents: 0 }])
    ).toBe(30025);
    expect(
      collectionPlayerPrice([fixed, { ...fixed, fixedRateCents: 5000 }], [])
    ).toBe(35025);
  });
  it("never redistributes a fixed rate when the roster changes", () => {
    expect(collectionShares(fixed, ["a"])).toEqual({ a: 30025 });
    expect(collectionShares(fixed, ["a", "b", "a"])).toEqual({
      a: 30025,
      b: 30025,
    });
    expect(collectionShares(fixed, [])).toEqual({});
  });
  it("retains variable cent-conserving splits and pending prices", () => {
    const split = { totalCents: 1001, contributionMode: "split" as const };
    expect(collectionShares(split, ["a", "b"])).toEqual({ a: 501, b: 500 });
    expect(collectionPlayerPrice([split], [])).toBeNull();
    expect(
      collectionPlayerPrice(
        [split],
        [{ sessionPlayerId: "a", amountCents: 501 }]
      )
    ).toBe(501);
  });
  it.each([null, 0, -100, 0.5])(
    "rejects invalid fixed rate %s",
    (fixedRateCents) => {
      expect(() =>
        collectionShares({ ...fixed, fixedRateCents }, ["a"])
      ).toThrow();
    }
  );
  it("protects proof history even after a new proof was requested", () => {
    expect(
      hasPaymentHistory({
        status: "unpaid",
        proofStoragePath: "proof",
        reviewNote: "Please resend",
      })
    ).toBe(true);
    expect(hasPaymentHistory({ status: "unpaid" })).toBe(false);
  });
});

describe("expense breakdown validation", () => {
  const items = [
    { label: "Court", amountCents: 120000 },
    { label: "Balls", amountCents: 30000 },
  ];
  it("persists the actual breakdown independently from a fixed rate", () => {
    const value = paymentSetupSchema.parse({
      ...setup,
      items,
      contributionMode: "fixed",
      fixedRate: "300.25",
    });
    expect(collectionSetupValues(value)).toEqual({
      items,
      totalCents: 150000,
      contributionMode: "fixed",
      fixedRateCents: 30025,
    });
  });
  it.each([
    { items: [] },
    { items: [{ label: "Court", amountCents: -1 }] },
    { items: [{ label: "Court", amountCents: 1.5 }] },
    { items: [{ label: "Court", amountCents: 100 }] },
    { contributionMode: "fixed" },
    { contributionMode: "fixed", fixedRate: "0" },
    { contributionMode: "fixed", fixedRate: "3.001" },
  ])("rejects invalid or mismatched inputs: %o", (extra) => {
    expect(paymentSetupSchema.safeParse({ ...setup, ...extra }).success).toBe(
      false
    );
  });
  it("rejects malformed serialized items rather than discarding them", () => {
    const data = new FormData();
    for (const [key, value] of Object.entries(setup)) data.set(key, value);
    data.set("items", "{invalid");
    expect(paymentSetupSchema.safeParse(paymentSetupInput(data)).success).toBe(
      false
    );
  });
});

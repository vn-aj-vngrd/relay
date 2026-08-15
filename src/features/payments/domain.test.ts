import { describe, expect, it } from "vitest";
import { splitExpense, validatePaymentProof } from "./domain";

describe("expense splitting", () => {
  it("preserves every cent deterministically", () => {
    const result = splitExpense(1000, ["a", "b", "c"]);
    expect(result).toEqual({ a: 334, b: 333, c: 333 });
  });
  it("respects overrides and divides the remainder", () => {
    expect(splitExpense(2400, ["a", "b", "c"], { a: 400 })).toEqual({ a: 400, b: 1000, c: 1000 });
  });
  it("accepts one compact image as payment proof", () => {
    expect(validatePaymentProof({ type: "image/jpeg", size: 2_000_000 })).toBeNull();
    expect(validatePaymentProof({ type: "application/pdf", size: 500_000 })).toBe("Upload one JPG, PNG, or WebP image.");
    expect(validatePaymentProof({ type: "image/png", size: 6_000_000 })).toBe("Keep payment proof under 5 MB.");
  });
});

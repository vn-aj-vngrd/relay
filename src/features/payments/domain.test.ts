import { describe, expect, it } from "vitest";
import { splitExpense } from "./domain";

describe("expense splitting", () => {
  it("preserves every cent deterministically", () => {
    const result = splitExpense(1000, ["a", "b", "c"]);
    expect(result).toEqual({ a: 334, b: 333, c: 333 });
  });
  it("respects overrides and divides the remainder", () => {
    expect(splitExpense(2400, ["a", "b", "c"], { a: 400 })).toEqual({ a: 400, b: 1000, c: 1000 });
  });
});

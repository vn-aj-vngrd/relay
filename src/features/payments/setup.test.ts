import { describe, expect, it } from "vitest";
import {
  creationPaymentSummary,
  hasSavedPaymentSetup,
  paymentChoiceSummary,
  paymentSetupInput,
  paymentSetupSchema,
  paymentSetupValidationError,
  serializableCreationValues,
} from "./setup";

const valid = {
  label: "Court",
  total: "2400",
  method: "GCash",
  details: "Host account",
};

describe("payment setup", () => {
  it("returns only the invalid field rather than blaming every payment detail", () => {
    const parsed = paymentSetupSchema.safeParse({ ...valid, details: "" });
    if (parsed.success) throw new Error("Expected invalid instructions");
    expect(paymentSetupValidationError(parsed.error)).toEqual({
      error:
        "A few payment details need attention. Check the highlighted fields below.",
      fieldErrors: {
        details: "Enter payment instructions with 2–300 characters.",
      },
    });
  });
  it("preserves array indexes for expense validation", () => {
    const parsed = paymentSetupSchema.safeParse({
      ...valid,
      items: [
        { label: "Court", amountCents: 240000 },
        { label: "", amountCents: -1 },
      ],
    });
    if (parsed.success) throw new Error("Expected invalid expense");
    const { fieldErrors } = paymentSetupValidationError(parsed.error);
    expect(fieldErrors["items.1.label"]).toBeDefined();
    expect(Object.keys(fieldErrors)).toContain("items.1.amountCents");
    expect(Object.keys(fieldErrors)).not.toContain("items.0.label");
  });
  it("distinguishes collection intent from a configured split in Review", () => {
    const summary = creationPaymentSummary({
      costKind: "collect",
      visibility: "public",
    });
    expect(summary).toContain(
      "Set the price and instructions in Game settings"
    );
    expect(summary).toContain("It won’t appear in Open games");
    expect(summary).not.toContain("calculated when players join");
    expect(summary).not.toContain("₱");
    expect(hasSavedPaymentSetup({ costKind: "collect" })).toBe(false);
  });
  it("retains the details of an older collection draft in Review", () => {
    expect(hasSavedPaymentSetup(valid)).toBe(true);
    const summary = creationPaymentSummary({ ...valid, costKind: "collect" });
    expect(summary).toContain("₱2400 total");
    expect(summary).toContain("GCash · Host account");
  });
  it.each(["0", "-1", "Infinity", "1000001", ""])(
    "rejects invalid collection total %s",
    (total) => {
      expect(paymentSetupSchema.safeParse({ ...valid, total }).success).toBe(
        false
      );
    }
  );
  it("validates the same serializable setup in creation and settings", () => {
    const data = new FormData();
    for (const [key, value] of Object.entries(valid)) data.set(key, value);
    expect(paymentSetupSchema.parse(paymentSetupInput(data))).toEqual({
      ...valid,
      total: 2400,
      contributionMode: "split",
    });
  });
  it("distinguishes Free, unset, and pending collection shares", () => {
    expect(paymentChoiceSummary(undefined)).toBe("Payment not set up yet");
    expect(paymentChoiceSummary("free")).toBe("Free · No payment needed");
    expect(paymentChoiceSummary("collect")).toContain(
      "calculated when players join"
    );
  });
  it("retains choices and fields but never serializes uploads", () => {
    const data = new FormData();
    for (const [key, value] of Object.entries({
      ...valid,
      costKind: "collect",
    }))
      data.set(key, value);
    data.set(
      "receipt",
      new Blob(["sensitive image"], { type: "image/png" }),
      "receipt.png"
    );
    data.set(
      "qr",
      new Blob(["sensitive image"], { type: "image/png" }),
      "qr.png"
    );
    expect(serializableCreationValues(data)).toEqual({
      ...valid,
      costKind: "collect",
    });
  });
});

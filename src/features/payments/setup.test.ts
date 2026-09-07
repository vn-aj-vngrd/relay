import { describe, expect, it } from "vitest";
import {
  paymentChoiceSummary,
  paymentSetupInput,
  paymentSetupSchema,
  serializableCreationValues,
} from "./setup";

const valid = {
  label: "Court",
  total: "2400",
  method: "GCash",
  details: "Host account",
};

describe("payment setup", () => {
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

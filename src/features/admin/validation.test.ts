import { describe, expect, it } from "vitest";

import {
  adminCreateUserSchema,
  adminReasonSchema,
  adminSessionActionSchema,
  adminSignupCapacitySchema,
  adminUpdateProfileSchema,
  adminUserActionSchema,
} from "./validation";

const id = "59c6fa3f-3f6f-45f2-bbea-b85bc90aa3a7";

describe("admin action validation", () => {
  it("requires a useful reason and trims it", () => {
    expect(adminReasonSchema.safeParse("no").success).toBe(false);
    expect(adminReasonSchema.parse("  Duplicate account  ")).toBe("Duplicate account");
  });

  it("rejects malformed user and session identifiers", () => {
    expect(adminUserActionSchema.safeParse({ userId: "user", reason: "Policy review" }).success).toBe(false);
    expect(adminSessionActionSchema.safeParse({ sessionId: "game", reason: "Host request" }).success).toBe(false);
  });

  it("accepts valid moderation requests", () => {
    expect(adminUserActionSchema.safeParse({ userId: id, reason: "Repeated abuse reports" }).success).toBe(true);
    expect(adminSessionActionSchema.safeParse({ sessionId: id, reason: "Host requested cancellation" }).success).toBe(
      true,
    );
  });

  it("accepts a bounded whole-number signup capacity", () => {
    expect(adminSignupCapacitySchema.parse({ accountCap: "200" })).toEqual({ accountCap: 200 });
    expect(adminSignupCapacitySchema.safeParse({ accountCap: "0" }).success).toBe(false);
    expect(adminSignupCapacitySchema.safeParse({ accountCap: "2.5" }).success).toBe(false);
    expect(adminSignupCapacitySchema.safeParse({ accountCap: "50001" }).success).toBe(false);
  });

  it("normalizes new accounts and validates profile edits", () => {
    const created = adminCreateUserSchema.parse({
      email: " Player@Example.com ",
      name: " Mika Santos ",
      username: "mika-santos",
    });
    expect(created).toMatchObject({ email: "player@example.com", name: "Mika Santos" });
    expect(adminCreateUserSchema.safeParse({ email: "bad", name: "M", username: "Bad Name" }).success).toBe(false);
    expect(
      adminUpdateProfileSchema.safeParse({
        userId: id,
        name: "Mika Santos",
        username: "mika-santos",
        city: "Manila",
        skillLevel: "regular",
        dominantHand: "right",
      }).success,
    ).toBe(true);
  });
});

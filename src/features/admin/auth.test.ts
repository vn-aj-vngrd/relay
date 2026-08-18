import { describe, expect, it } from "vitest";

import { parseAdminEmails } from "./validation";

describe("parseAdminEmails", () => {
  it("normalizes, trims, and removes empty entries", () => {
    expect([...parseAdminEmails(" Owner@Example.com, support@example.com, ")]).toEqual([
      "owner@example.com",
      "support@example.com",
    ]);
  });

  it("returns an empty allowlist when unconfigured", () => {
    expect(parseAdminEmails("").size).toBe(0);
  });
});

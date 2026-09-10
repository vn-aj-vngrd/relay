import { describe, expect, it } from "vitest";

import { notificationPresentation } from "@/features/notifications/domain";

describe("subscription notifications", () => {
  it.each([
    "subscription_renewal",
    "subscription_review",
    "subscription_grant",
    "subscription_assignment",
  ])("routes %s to personal billing, never a game payment", (type) => {
    const notice = notificationPresentation({
      type,
      sessionId: null,
      sessionTitle: null,
      payload: { href: "https://untrusted.example/pay" },
    });
    expect(notice.href).toBe("/settings/plan");
    expect(notice.tone).toBe("system");
  });
  it("never implies that a renewal automatically charges the account", () => {
    const notice = notificationPresentation({
      type: "subscription_renewal",
      sessionId: null,
      sessionTitle: null,
      payload: {},
    });
    expect(notice.body).toContain("Renew manually");
    expect(notice.body).toContain("No automatic charge");
  });
});

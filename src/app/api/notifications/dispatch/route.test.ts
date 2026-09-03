import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  dispatch: vi.fn(),
  enabled: true,
  secret: "dispatch-secret",
}));
vi.mock("@/features/notifications/delivery", () => ({
  dispatchNotificationDeliveries: mocks.dispatch,
}));
vi.mock("@/lib/env", () => ({
  getNotificationEnv: () => ({
    enabled: mocks.enabled,
    dispatchSecret: mocks.secret,
  }),
}));

import { POST } from "./route";

beforeEach(() => {
  mocks.dispatch
    .mockReset()
    .mockResolvedValue({ processed: 2, sent: 1, suppressed: 1, failed: 0 });
  mocks.enabled = true;
  mocks.secret = "dispatch-secret";
});

describe("notification dispatch route", () => {
  it("rejects requests without the private scheduler secret", async () => {
    const response = await POST(
      new Request("https://relay.example/api/notifications/dispatch") as never
    );
    expect(response.status).toBe(401);
    expect(mocks.dispatch).not.toHaveBeenCalled();
  });

  it("runs a bounded delivery pass for the scheduler", async () => {
    const response = await POST(
      new Request("https://relay.example/api/notifications/dispatch", {
        method: "POST",
        headers: { authorization: "Bearer dispatch-secret" },
      }) as never
    );
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({
      processed: 2,
      sent: 1,
    });
  });
});

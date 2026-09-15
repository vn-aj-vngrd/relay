import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
const mocks = vi.hoisted(() => ({
  user: vi.fn(),
  account: vi.fn(),
  limit: vi.fn(),
}));
vi.mock("@/features/auth/session", () => ({ getCurrentUser: mocks.user }));
vi.mock("@/db/client", () => ({
  db: { query: { users: { findFirst: mocks.account } } },
}));
vi.mock("@/lib/rate-limit", () => ({ checkRateLimit: mocks.limit }));

import { AgentHistoryError } from "./history";
import { withAgentHistory } from "./history-api";

const request = (method = "GET", origin = "https://relay.test") =>
  new Request("https://relay.test/api/agent/conversations", {
    method,
    headers: { origin },
  });
beforeEach(() => {
  vi.resetAllMocks();
  mocks.user.mockResolvedValue({ id: "owner", app_metadata: {} });
  mocks.account.mockResolvedValue({ suspendedAt: null });
  mocks.limit.mockResolvedValue({ allowed: true });
});
describe("history API authorization", () => {
  it("rejects cross-origin mutations before authentication or storage", async () => {
    const action = vi.fn();
    expect(
      (await withAgentHistory(request("DELETE", "https://evil.test"), action))
        .status
    ).toBe(403);
    expect(mocks.user).not.toHaveBeenCalled();
    expect(action).not.toHaveBeenCalled();
  });
  it("requires an active authenticated account", async () => {
    const action = vi.fn();
    mocks.user.mockResolvedValue(null);
    expect((await withAgentHistory(request(), action)).status).toBe(401);
    mocks.user.mockResolvedValue({ id: "owner", app_metadata: {} });
    mocks.account.mockResolvedValue({ suspendedAt: new Date() });
    expect((await withAgentHistory(request(), action)).status).toBe(403);
    mocks.account.mockResolvedValue({ suspendedAt: null });
    mocks.user.mockResolvedValue({
      id: "owner",
      app_metadata: { force_password_change: true },
    });
    expect((await withAgentHistory(request(), action)).status).toBe(403);
    expect(action).not.toHaveBeenCalled();
  });
  it("passes only server identity and disables response caching", async () => {
    const action = vi.fn().mockResolvedValue({ conversations: [] });
    const response = await withAgentHistory(request(), action);
    expect(action).toHaveBeenCalledWith("owner");
    expect(response.headers.get("Cache-Control")).toBe("private, no-store");
  });
  it("returns safe missing-chat errors without leaking database failures", async () => {
    const missing = await withAgentHistory(request(), async () => {
      throw new AgentHistoryError(404, "Chat not found.");
    });
    expect(missing.status).toBe(404);
    const failed = await withAgentHistory(request(), async () => {
      throw new Error("PRIVATE DATABASE DETAILS");
    });
    expect(failed.status).toBe(503);
    expect(await failed.text()).not.toContain("PRIVATE");
  });
});

import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  confirm: vi.fn(),
  start: vi.fn(),
  update: vi.fn(),
  cancel: vi.fn(),
  list: vi.fn(),
}));
vi.mock("@/features/agent/creation-service", () => ({
  confirmCreation: mocks.confirm,
  startCreationForm: mocks.start,
  updateCreationForm: mocks.update,
  creationOptions: vi.fn(),
  cancelCreation: mocks.cancel,
  listCreationProposals: mocks.list,
}));
vi.mock("@/features/agent/history", () => ({
  AgentHistoryError: class extends Error {
    status: number;
    constructor(status: number, message: string) {
      super(message);
      this.status = status;
    }
  },
}));
vi.mock("@/features/agent/history-api", () => ({
  withAgentHistory: async (
    _request: Request,
    action: (id: string) => Promise<unknown>
  ) => {
    try {
      return Response.json(await action("actor"));
    } catch {
      return new Response(null, { status: 400 });
    }
  },
}));
vi.mock("@/features/agent/config", () => ({ readAgentSettings: vi.fn() }));

import { GET, POST, PUT } from "./route";

const id = "10000000-0000-4000-8000-000000000001";
describe("Agent creation endpoint", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.start.mockResolvedValue({ status: "collecting" });
    mocks.update.mockResolvedValue({ status: "pending" });
    mocks.confirm.mockResolvedValue({ status: "completed" });
    mocks.cancel.mockResolvedValue({ status: "cancelled" });
    mocks.list.mockResolvedValue([]);
  });
  it("accepts only the action identity through the authenticated boundary", async () => {
    const response = await POST(
      new Request("https://relay.test/api/agent/creations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, action: "confirm" }),
      })
    );
    expect(response.status).toBe(200);
    expect(mocks.confirm).toHaveBeenCalledWith("actor", id);
  });
  it("rejects client payload edits disguised as confirmation", async () => {
    const response = await POST(
      new Request("https://relay.test/api/agent/creations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id,
          action: "confirm",
          input: { title: "Changed" },
        }),
      })
    );
    expect(response.status).toBe(400);
    expect(mocks.confirm).not.toHaveBeenCalled();
  });
  it("prepares a form review without executing a creation", async () => {
    const response = await PUT(
      new Request("https://relay.test/api/agent/creations", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "review",
          id,
          requestId: id,
          input: { kind: "group", title: "Friday crew" },
        }),
      })
    );
    expect(response.status).toBe(200);
    expect(mocks.update).toHaveBeenCalledWith(
      "actor",
      id,
      expect.objectContaining({ kind: "group", title: "Friday crew" }),
      true,
      id
    );
    expect(mocks.confirm).not.toHaveBeenCalled();
  });
  it("never accepts approval through the form endpoint", async () => {
    const response = await PUT(
      new Request("https://relay.test/api/agent/creations", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "confirm",
          id,
          input: { kind: "group", title: "Friday crew" },
        }),
      })
    );
    expect(response.status).toBe(400);
    expect(mocks.confirm).not.toHaveBeenCalled();
    expect(mocks.update).not.toHaveBeenCalled();
  });
  it("loads proposals for the authenticated actor and requested chat", async () => {
    await GET(new Request(`https://relay.test/api/agent/creations?chat=${id}`));
    expect(mocks.list).toHaveBeenCalledWith("actor", id);
  });
});

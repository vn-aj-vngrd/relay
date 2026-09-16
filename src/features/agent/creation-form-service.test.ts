import { beforeEach, describe, expect, it, vi } from "vitest";
import type { CreationInput, CreationPreview } from "./creation-schema";

vi.mock("server-only", () => ({}));
const state = vi.hoisted(() => ({
  row: null as null | {
    id: string;
    userId: string;
    conversationId: string;
    messageId: string;
    status: string;
    input: CreationInput;
    preview: CreationPreview;
    expiresAt: Date;
  },
  inserts: [] as Record<string, unknown>[],
  enabled: true,
  history: [] as Record<string, unknown>[],
}));
vi.mock("./config", () => ({
  readAgentSettings: async () => ({
    config: {
      enabled: state.enabled,
      allowGameCreation: true,
      allowGroupCreation: true,
    },
  }),
}));
vi.mock("@/features/auth/session", () => ({ requireUser: vi.fn() }));
vi.mock("@/features/groups/create-group-command", () => ({
  createGroupCommand: vi.fn(),
}));
vi.mock("@/features/sessions/create-session-command", () => ({
  createSessionCommand: vi.fn(),
}));
vi.mock("@/db/client", () => {
  const db = {
    transaction: async <T>(work: (tx: unknown) => Promise<T>): Promise<T> =>
      work(db),
    query: {
      agentCreationProposals: { findFirst: async () => state.inserts.at(-1) },
      agentConversations: { findFirst: async () => ({ activeUntil: null }) },
    },
    select: () => ({
      from: () => ({
        where: () => ({
          for: async () => (state.row ? [state.row] : []),
          orderBy: () => {
            const rows = Promise.resolve(state.history);
            return Object.assign(rows, {
              limit: async (count: number) => state.history.slice(0, count),
            });
          },
        }),
      }),
    }),
    update: () => ({
      set: (values: Record<string, unknown>) => ({
        where: () => {
          Object.assign(state.row!, values);
          return { returning: async () => [state.row] };
        },
      }),
    }),
    insert: () => ({
      values: (values: Record<string, unknown>) => ({
        returning: async () => {
          const row = {
            ...values,
            id: "fresh-id",
            status: "pending",
            destination: null,
          };
          state.inserts.push(row);
          return [row];
        },
      }),
    }),
  };
  return { db };
});

import { inputForCreation } from "./creation-form-model";
import { listCreationProposals, updateCreationForm } from "./creation-service";

beforeEach(() => {
  state.inserts = [];
  state.enabled = true;
  state.row = {
    id: "old-id",
    userId: "owner",
    conversationId: "chat",
    messageId: "message",
    status: "pending",
    input: { ...inputForCreation("group"), title: "Friday crew" },
    preview: { collecting: true, title: "Friday crew", lines: [], people: [] },
    expiresAt: new Date(Date.now() + 60000),
  };
});
describe("Server-owned guided form review", () => {
  it("replaces setup with a fresh immutable approval identity", async () => {
    const result = await updateCreationForm(
      "owner",
      "old-id",
      state.row!.input,
      true
    );
    expect(state.row!.status).toBe("cancelled");
    expect(result.id).toBe("fresh-id");
    expect(result.status).toBe("pending");
    expect(result.preview.collecting).toBeUndefined();
    expect(result.preview.lines).toContain("1 member, including you as owner.");
  });
  it("recovers the same review when a committed response is lost", async () => {
    const input = state.row!.input;
    const first = await updateCreationForm(
      "owner",
      "old-id",
      input,
      true,
      "retry-token"
    );
    const retry = await updateCreationForm(
      "owner",
      "old-id",
      input,
      true,
      "retry-token"
    );
    expect(retry.id).toBe(first.id);
    expect(state.inserts).toHaveLength(1);
  });
  it("invalidates an approval before accepting edits", async () => {
    state.row!.preview.collecting = undefined;
    const result = await updateCreationForm(
      "owner",
      "old-id",
      { ...state.row!.input, title: "Saturday crew" },
      false
    );
    expect(state.row!.status).toBe("cancelled");
    expect(result.id).toBe("fresh-id");
    expect(result.status).toBe("collecting");
    expect(result.input.title).toBe("Saturday crew");
  });
  it.each(["missing", "completed", "cancelled", "disabled"])(
    "rejects %s setups",
    async (status) => {
      const input = state.row!.input;
      if (status === "missing") state.row = null;
      else if (status === "disabled") state.enabled = false;
      else state.row!.status = status;
      await expect(
        updateCreationForm("owner", "old-id", input, true)
      ).rejects.toThrow();
      expect(state.inserts).toHaveLength(0);
    }
  );
});

describe("Creation result restoration", () => {
  it("retains completed destinations beyond 100 proposals", async () => {
    state.history = Array.from({ length: 125 }, (_, index) => ({
      ...state.row,
      id: `completed-${index}`,
      status: "completed",
      destination: `/groups/group-${index}`,
    }));
    const restored = await listCreationProposals("owner", "chat");
    expect(restored).toHaveLength(125);
    expect(restored[0].destination).toBe("/groups/group-0");
    expect(restored[124].destination).toBe("/groups/group-124");
  });
});

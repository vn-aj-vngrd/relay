import { beforeEach, describe, expect, it, vi } from "vitest";
import type { CreationHooks } from "@/features/sessions/create-session-command";
import { creationInputSchema } from "./creation-schema";

vi.mock("server-only", () => ({}));
const mocks = vi.hoisted(() => ({
  proposal: null as Record<string, unknown> | null,
  config: { enabled: true, allowGameCreation: true, allowGroupCreation: true },
  command: vi.fn(),
  writes: 0,
  actor: "actor",
  activeUntil: null as Date | null,
  archivedAt: null as Date | null,
}));
vi.mock("@/features/auth/session", () => ({
  requireUser: async () => ({ id: mocks.actor }),
}));
vi.mock("@/features/groups/create-group-command", () => ({
  createGroupCommand: mocks.command,
}));
vi.mock("@/features/sessions/create-session-command", () => ({
  createSessionCommand: mocks.command,
}));
vi.mock("./config", () => ({
  readAgentSettings: async () => ({ config: mocks.config }),
}));
vi.mock("@/db/client", async () => {
  const { agentConversations, agentSettings } = await import("@/db/schema");
  const database = {
    query: {
      users: { findFirst: async () => ({ suspendedAt: null }) },
      agentCreationProposals: { findFirst: async () => mocks.proposal },
      agentConversations: {
        findFirst: async () => ({ activeUntil: mocks.activeUntil }),
      },
    },
    select: () => ({
      from: (table: unknown) => ({
        where: () => ({
          for: async () =>
            table === agentSettings
              ? [mocks.config]
              : table === agentConversations
                ? [
                    {
                      activeUntil: mocks.activeUntil,
                      archivedAt: mocks.archivedAt,
                    },
                  ]
                : [mocks.proposal],
        }),
      }),
    }),
    update: () => ({
      set: (values: Record<string, unknown>) => ({
        where: async () => {
          Object.assign(mocks.proposal!, values);
        },
      }),
    }),
  };
  return { db: database };
});

import { db } from "@/db/client";
import { confirmCreation } from "./creation-service";

beforeEach(() => {
  vi.clearAllMocks();
  mocks.actor = "actor";
  mocks.writes = 0;
  mocks.activeUntil = null;
  mocks.archivedAt = null;
  mocks.config = {
    enabled: true,
    allowGameCreation: true,
    allowGroupCreation: true,
  };
  mocks.proposal = {
    id: "proposal",
    userId: "actor",
    conversationId: "chat",
    messageId: "message",
    status: "pending",
    destination: null,
    input: creationInputSchema.parse({ kind: "group", title: "Friday crew" }),
    preview: {
      title: "Friday crew",
      lines: ["No description", "1 member, including you as owner."],
      people: [],
    },
    expiresAt: new Date(Date.now() + 60_000),
  };
  mocks.command.mockImplementation(
    async (_actor: unknown, _form: FormData, hooks: CreationHooks) => {
      const tx = db as unknown as Parameters<CreationHooks["beforeCreate"]>[0];
      await hooks.beforeCreate(tx);
      mocks.writes++;
      await hooks.afterCreate(tx, "/groups/friday");
      return { destination: "/groups/friday" };
    }
  );
});
describe("Agent confirmation lifecycle", () => {
  it("returns the same completed resource on a repeated confirmation", async () => {
    expect((await confirmCreation("actor", "proposal")).destination).toBe(
      "/groups/friday"
    );
    expect((await confirmCreation("actor", "proposal")).destination).toBe(
      "/groups/friday"
    );
    expect(mocks.writes).toBe(1);
  });
  it.each([
    "collecting",
    "cancelled",
    "expired",
    "disabled",
    "busy",
    "archived",
    "changed",
  ])("denies %s previews before a domain write", async (state) => {
    if (state === "collecting")
      (mocks.proposal!.preview as Record<string, unknown>).collecting = true;
    if (state === "cancelled") mocks.proposal!.status = "cancelled";
    if (state === "expired") mocks.proposal!.expiresAt = new Date(0);
    if (state === "disabled") mocks.config.allowGroupCreation = false;
    if (state === "busy") mocks.activeUntil = new Date(Date.now() + 60_000);
    if (state === "archived") mocks.archivedAt = new Date();
    if (state === "changed")
      mocks.proposal!.preview = { title: "Different", lines: [], people: [] };
    await expect(confirmCreation("actor", "proposal")).rejects.toThrow();
    expect(mocks.writes).toBe(0);
  });
  it("accepts equivalent JSONB payloads regardless of object key order", async () => {
    const input = mocks.proposal!.input as Record<string, unknown>;
    mocks.proposal!.input = Object.fromEntries(Object.entries(input).reverse());
    expect((await confirmCreation("actor", "proposal")).status).toBe(
      "completed"
    );
  });
  it("rejects an account change before execution", async () => {
    mocks.actor = "different";
    await expect(confirmCreation("actor", "proposal")).rejects.toThrow(
      "Account changed"
    );
    expect(mocks.command).not.toHaveBeenCalled();
  });
  it("recovers a committed result when a post-commit effect fails", async () => {
    const implementation = mocks.command.getMockImplementation()!;
    mocks.command.mockImplementationOnce(async (...args: unknown[]) => {
      await implementation(...args);
      throw new Error("Analytics unavailable");
    });
    expect((await confirmCreation("actor", "proposal")).status).toBe(
      "completed"
    );
    expect(mocks.writes).toBe(1);
  });
});

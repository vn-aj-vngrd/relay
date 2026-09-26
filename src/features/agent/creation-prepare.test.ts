import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  type CreationInput,
  type CreationPreview,
  creationPreparationSchema,
} from "./creation-schema";

vi.mock("server-only", () => ({}));
const state = vi.hoisted(() => ({
  saved: null as CreationInput | null,
  preview: null as CreationPreview | null,
  expiresAt: null as Date | null,
  busy: true,
  archivedAt: null as Date | null,
}));
vi.mock("./config", () => ({
  readAgentSettings: async () => ({
    config: {
      enabled: true,
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
  const database = {
    query: {
      sessions: {
        findFirst: async () => ({
          id: "00000000-0000-4000-8000-000000000001",
          title: "Evening game",
          venueName: "Cebu court",
          venueId: null,
          venueAddress: "Cebu City",
          capacity: 12,
          courtCount: 2,
          startsAt: new Date("2026-09-01T10:00:00Z"),
          endsAt: new Date("2026-09-01T12:00:00Z"),
          visibility: "private",
          requiresApproval: true,
          accentColor: "teal",
          groupId: null,
        }),
      },
    },
    transaction: async <T>(work: (tx: unknown) => Promise<T>) => work(database),
    select: () => ({
      from: () => ({
        where: () => ({
          for: async () => [
            {
              activeRequestId: "request",
              activeUntil: state.busy ? new Date(Date.now() + 60_000) : null,
              archivedAt: state.archivedAt,
            },
          ],
        }),
      }),
    }),
    update: () => ({
      set: () => ({ where: async () => undefined }),
    }),
    insert: () => ({
      values: (row: {
        input: CreationInput;
        preview: CreationPreview;
        expiresAt: Date;
      }) => ({
        returning: async () => {
          state.saved = row.input;
          state.preview = row.preview;
          state.expiresAt = row.expiresAt;
          return [
            { ...row, id: "proposal", status: "pending", destination: null },
          ];
        },
      }),
    }),
  };
  return { db: database };
});

import { createGroupCommand } from "@/features/groups/create-group-command";
import { inputForCreation } from "./creation-model";
import { prepareCreation, startCreationForm } from "./creation-service";

beforeEach(() => {
  state.saved = null;
  state.preview = null;
  state.expiresAt = null;
  state.busy = true;
  state.archivedAt = null;
  vi.clearAllMocks();
});

describe("Conversational replay preparation", () => {
  it("starts a chat draft even for a legacy question-mode request", async () => {
    state.busy = false;
    const result = await startCreationForm("owner", "chat", {
      ...inputForCreation("group"),
      interactionMode: "questions",
    });
    expect(result.status).toBe("collecting");
    expect(result.input.interactionMode).toBe("chat");
    expect(createGroupCommand).not.toHaveBeenCalled();
  });
  it("rejects starting a setup in an archived chat", async () => {
    state.busy = false;
    state.archivedAt = new Date();
    await expect(
      startCreationForm("owner", "chat", inputForCreation("group"))
    ).rejects.toThrow("Restore this chat before continuing.");
    expect(state.saved).toBeNull();
  });
  it.each([
    ["chat", undefined, "needs_answer", true],
    ["chat", "Friday crew", "needs_approval", undefined],
    ["questions", "Friday crew", "needs_approval", undefined],
    [undefined, "Friday crew", "needs_approval", undefined],
    ["questions", undefined, "needs_answer", true],
  ] as const)(
    "retains %s interaction and prepares only complete chat drafts for approval",
    async (interactionMode, title, status, collecting) => {
      const result = await prepareCreation(
        "owner",
        "chat",
        "message",
        "request",
        creationPreparationSchema.parse({
          kind: "group",
          interactionMode,
          title,
        })
      );
      expect(state.saved?.interactionMode).toBe("chat");
      expect(result.status).toBe(status);
      expect(state.preview?.collecting).toBe(collecting);
      expect(createGroupCommand).not.toHaveBeenCalled();
      if (status === "needs_approval") {
        expect(state.preview?.title).toBe("Friday crew");
        expect(state.preview?.lines).toContain(
          "1 member, including you as owner."
        );
        expect(state.expiresAt!.getTime() - Date.now()).toBeLessThanOrEqual(
          30 * 60_000
        );
        expect(result.message).toContain("explicit approval button");
      } else {
        expect(result.message).toContain(
          "exactly one missing or corrective question"
        );
      }
    }
  );
  it.each([
    [undefined, undefined, "private", true],
    ["link", false, "link", false],
    ["public", undefined, "public", true],
    [undefined, false, "private", false],
  ] as const)(
    "preserves supplied visibility %s and approval %s",
    async (visibility, requiresApproval, expectedVisibility, expectedApproval) => {
      await prepareCreation(
        "owner",
        "chat",
        "message",
        "request",
        creationPreparationSchema.parse({
          kind: "game",
          flow: "replay",
          sourceSessionId: "00000000-0000-4000-8000-000000000001",
          visibility,
          requiresApproval,
        })
      );
      expect(state.saved).toMatchObject({
        visibility: expectedVisibility,
        requiresApproval: expectedApproval,
        title: "Evening game",
        venue: "Cebu court",
        venueAddress: "Cebu City",
        capacity: 12,
        courts: 2,
        start: "18:00",
        end: "20:00",
        accentColor: "teal",
      });
    }
  );
});

it("returns corrective guidance for complete but invalid Quick Play details", async () => {
  const { prepareCreation } = await import("./creation-service");
  const result = await prepareCreation(
    "user",
    "chat",
    "message",
    "request",
    creationPreparationSchema.parse({
      kind: "quickPlay",
      players: ["A", "B", "C", "D"],
      courts: 2,
    })
  );
  expect(result.status).toBe("needs_answer");
  expect(result.issues.join(" ")).toContain("Add 4 more players");
});

it("binds a draft flow without explicit intent to a saved draft", async () => {
  const result = await prepareCreation(
    "owner",
    "chat",
    "message",
    "request",
    creationPreparationSchema.parse({ kind: "game", flow: "draft" })
  );
  expect(result.status).toBe("needs_answer");
  expect(state.saved?.intent).toBe("draft");
});

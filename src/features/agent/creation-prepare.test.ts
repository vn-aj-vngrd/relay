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
              activeUntil: new Date(Date.now() + 60_000),
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
          return [row];
        },
      }),
    }),
  };
  return { db: database };
});

import { createGroupCommand } from "@/features/groups/create-group-command";
import { prepareCreation } from "./creation-service";

beforeEach(() => {
  state.saved = null;
  state.preview = null;
  state.expiresAt = null;
  vi.clearAllMocks();
});

describe("Conversational replay preparation", () => {
  it.each([
    ["chat", undefined, "needs_answer", true],
    ["chat", "Friday crew", "needs_approval", undefined],
    ["questions", "Friday crew", "needs_form", true],
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
      expect(state.saved?.interactionMode).toBe(interactionMode);
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
      } else if (interactionMode === "chat") {
        expect(result.message).toContain("exactly one missing question");
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

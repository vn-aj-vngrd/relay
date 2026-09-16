import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
const state = vi.hoisted(() => ({
  status: "completed",
  currentStatus: "completed",
  transaction: vi.fn(),
  insert: vi.fn(),
}));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("@/features/analytics/events", () => ({
  trackSessionMilestone: vi.fn(),
}));
vi.mock("@/lib/rate-limit", () => ({ assertRateLimit: vi.fn() }));
vi.mock("@/db/client", () => ({
  db: {
    query: {
      sessions: {
        findFirst: async () => ({
          id: "source",
          status: state.status,
          groupId: null,
        }),
      },
    },
    select: () => ({ from: () => ({ where: async () => [] }) }),
    transaction: state.transaction,
  },
}));

import type { requireUser } from "@/features/auth/session";
import { createGroupCommand } from "./create-group-command";

beforeEach(() => {
  vi.clearAllMocks();
  state.status = "completed";
  state.currentStatus = "completed";
  state.transaction.mockImplementation(async (work) =>
    work({
      select: () => ({
        from: () => ({
          where: () => ({
            for: async () => [
              {
                id: "source",
                status: state.currentStatus,
                groupId: null,
              },
            ],
          }),
        }),
      }),
      insert: state.insert,
    })
  );
});
const user = { id: "owner" } as Awaited<ReturnType<typeof requireUser>>;
function crewForm() {
  const form = new FormData();
  form.set("name", "Friday crew");
  form.set("sourceSessionId", "59c6fa3f-3f6f-45f2-bbea-b85bc90aa3a7");
  return form;
}
describe("Save completed game crew", () => {
  it.each(["draft", "published", "live", "cancelled"])(
    "rejects %s games before creating a group",
    async (status) => {
      state.status = status;
      expect(await createGroupCommand(user, crewForm())).toMatchObject({
        error: expect.stringContaining("Finish the game"),
      });
      expect(state.transaction).not.toHaveBeenCalled();
    }
  );
  it("rechecks completion under the transaction lock before inserting", async () => {
    state.currentStatus = "live";
    await expect(createGroupCommand(user, crewForm())).rejects.toThrow(
      "must be completed"
    );
    expect(state.insert).not.toHaveBeenCalled();
  });
});

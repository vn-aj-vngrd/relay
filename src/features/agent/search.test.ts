import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
const mocks = vi.hoisted(() => ({ query: vi.fn() }));
vi.mock("@/db/client", async () => {
  const { drizzle } = await import("drizzle-orm/pg-proxy");
  return { db: drizzle(mocks.query) };
});
vi.mock("@/features/sessions/queries", () => ({
  getSessionForWorkspace: vi.fn(),
}));

import { searchAgentGames } from "./reads";
import { gameSearchSchema } from "./validation";

beforeEach(() => {
  mocks.query.mockReset();
  mocks.query.mockResolvedValue({ rows: [] });
});
describe("Agent database query boundaries", () => {
  it("parameterizes hostile text and binds private game membership to the viewer", async () => {
    const hostile = "'; DROP TABLE sessions; --";
    await searchAgentGames(
      "current-viewer",
      gameSearchSchema.parse({ scope: "mine", query: hostile })
    );
    const [query, parameters] = mocks.query.mock.calls[0];
    expect(query).not.toContain(hostile);
    expect(query).toContain('"session_players"."user_id"');
    expect(query).toContain('"session_players"."left_at" is null');
    expect(parameters).toContain("current-viewer");
    expect(parameters).toContain(`%${hostile}%`);
    expect(parameters).toContain(21);
  });
  it("retains group membership even when a specific group ID is supplied", async () => {
    const groupId = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
    await searchAgentGames(
      "current-viewer",
      gameSearchSchema.parse({ scope: "groups", groupId })
    );
    const [query, parameters] = mocks.query.mock.calls[0];
    expect(query).toContain('"group_members"."user_id"');
    expect(parameters).toContain("current-viewer");
    expect(parameters).toContain(groupId);
  });
  it("uses public discovery constraints and explicit inclusive date bounds", async () => {
    await searchAgentGames(
      "current-viewer",
      gameSearchSchema.parse({
        scope: "open",
        from: "2026-09-16",
        until: "2026-09-16",
      })
    );
    const [query, parameters] = mocks.query.mock.calls[0];
    expect(query).toContain('"sessions"."visibility"');
    expect(query).toContain('"sessions"."player_price_cents" is not null');
    expect(query).toContain("Asia/Manila");
    expect(parameters).toContain("public");
    expect(
      parameters.filter((value: unknown) => value === "2026-09-16")
    ).toHaveLength(2);
  });
});

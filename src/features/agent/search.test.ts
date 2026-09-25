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

describe("Agent game lifecycle and collection parity", () => {
  it("searches past games without the upcoming-only end-time restriction", async () => {
    await searchAgentGames(
      "viewer",
      gameSearchSchema.parse({ scope: "mine", when: "past" })
    );
    const [query, parameters] = mocks.query.mock.calls[0];
    expect(query).toContain('"sessions"."ends_at" <=');
    const filter = query.slice(query.indexOf(' from "sessions" where '));
    expect(filter).not.toContain('"sessions"."ends_at" >');
    expect(parameters).toContain("completed");
    expect(query).toContain('"sessions"."starts_at" desc');
  });
  it("keeps all-time searches free of a time cutoff", async () => {
    await searchAgentGames(
      "viewer",
      gameSearchSchema.parse({
        scope: "mine",
        when: "all",
        includeCancelled: true,
      })
    );
    const [query, parameters] = mocks.query.mock.calls[0];
    const filter = query.slice(query.indexOf(' from "sessions" where '));
    expect(filter).not.toMatch(/"ends_at" [<>]=?/);
    expect(parameters).toContain("cancelled");
  });
  it("finds ongoing scheduled games as well as live games", async () => {
    await searchAgentGames(
      "viewer",
      gameSearchSchema.parse({ scope: "mine", when: "current" })
    );
    const [query, parameters] = mocks.query.mock.calls[0];
    expect(query).toContain('"sessions"."starts_at" <=');
    expect(query).toContain('"sessions"."ends_at" >');
    expect(parameters).toContain("live");
  });
  it("uses received invitations rather than conflating invitations with attention", async () => {
    await searchAgentGames(
      "viewer",
      gameSearchSchema.parse({ scope: "invitations", when: "all" })
    );
    const [query] = mocks.query.mock.calls[0];
    expect(query).toContain(
      '"session_players"."invitation_received_at" is not null'
    );
    expect(query).toContain('"session_players"."left_at" is null');
  });
  it("never turns Open games into access to completed public history", async () => {
    await searchAgentGames(
      "viewer",
      gameSearchSchema.parse({ scope: "open", when: "all" })
    );
    const [query, parameters] = mocks.query.mock.calls[0];
    expect(query).toContain('"sessions"."ends_at" >');
    expect(parameters).toContain("public");
  });
  it("restricts group drafts to an owner with current group membership", async () => {
    await searchAgentGames(
      "viewer",
      gameSearchSchema.parse({ scope: "groups", when: "drafts" })
    );
    const [query, parameters] = mocks.query.mock.calls[0];
    expect(query).toContain('"groups"."owner_id"');
    expect(query).toContain('"group_members"."user_id"');
    expect(parameters).toContain("draft");
  });
  it("returns bounded pages and an honest continuation for historical results", async () => {
    mocks.query.mockResolvedValue({
      rows: Array.from({ length: 21 }, (_, index) => [
        String(index),
        "Past game",
      ]),
    });
    const result = await searchAgentGames(
      "viewer",
      gameSearchSchema.parse({ scope: "mine", when: "past" })
    );
    expect(result.games).toHaveLength(20);
    expect(result).toMatchObject({
      when: "past",
      nextOffset: 20,
      truncated: true,
    });
  });
});

import type { SQL } from "drizzle-orm";
import { PgDialect } from "drizzle-orm/pg-core";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
const state = vi.hoisted(() => ({
  queries: [] as { condition?: SQL; limit?: number }[],
}));
vi.mock("@/features/auth/session", () => ({ requireUser: vi.fn() }));
vi.mock("@/features/groups/create-group-command", () => ({
  createGroupCommand: vi.fn(),
}));
vi.mock("@/features/sessions/create-session-command", () => ({
  createSessionCommand: vi.fn(),
}));
vi.mock("./config", () => ({ readAgentSettings: vi.fn() }));
vi.mock("@/db/client", () => ({
  db: {
    select: () => {
      const query: { condition?: SQL; limit?: number } = {};
      state.queries.push(query);
      const builder = {
        from: () => builder,
        innerJoin: () => builder,
        leftJoin: () => builder,
        where: (condition: SQL) => {
          query.condition = condition;
          return builder;
        },
        orderBy: () => builder,
        limit: async (limit: number) => {
          query.limit = limit;
          return [];
        },
      };
      return builder;
    },
  },
}));

import { creationOptions } from "./creation-service";

beforeEach(() => {
  state.queries = [];
});

describe("Authorized creation options", () => {
  it.each([
    ["a-group-outside-first-thirty", "slug"],
    ["00000000-0000-4000-8000-000000000001", "id"],
  ])(
    "filters exact group %s before the bounded list limit",
    async (reference, column) => {
      await creationOptions("owner", false, reference);
      const query = state.queries[0];
      const sql = new PgDialect().sqlToQuery(query.condition!);
      expect(sql.sql).toContain('"group_members"."user_id" =');
      expect(sql.sql).toContain(`"groups"."${column}" =`);
      expect(sql.params).toEqual(["owner", reference]);
      expect(query.limit).toBe(30);
    }
  );

  it.each([true, false])(
    "honors court suggestions enabled=%s",
    async (includeCourts) => {
      await creationOptions("owner", includeCourts);
      expect(state.queries).toHaveLength(includeCourts ? 3 : 2);
      if (includeCourts) {
        const query = state.queries[2];
        const sql = new PgDialect().sqlToQuery(query.condition!);
        expect(sql.sql).toContain('"venues"."listing_status" =');
        expect(sql.params).toEqual(["verified"]);
        expect(query.limit).toBe(100);
      }
    }
  );
  it.each([
    ["court-outside-first-hundred", "slug"],
    ["00000000-0000-4000-8000-000000000002", "id"],
  ])(
    "resolves exact verified court %s before the list limit",
    async (reference, column) => {
      await creationOptions("owner", true, undefined, reference);
      const query = state.queries[2];
      const sql = new PgDialect().sqlToQuery(query.condition!);
      expect(sql.sql).toContain('"venues"."listing_status" =');
      expect(sql.sql).toContain(`"venues"."${column}" =`);
      expect(sql.params).toEqual(["verified", reference]);
      expect(query.limit).toBe(100);
    }
  );
  it("does not resolve a referenced court when court search is disabled", async () => {
    const result = await creationOptions(
      "owner",
      false,
      undefined,
      "private-court"
    );
    expect(state.queries).toHaveLength(2);
    expect(result.courts).toEqual([]);
  });
});

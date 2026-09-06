import { PgDialect } from "drizzle-orm/pg-core";
import { describe, expect, it } from "vitest";
import {
  groupCollectionCondition,
  groupCollectionOrder,
  groupFilterContext,
} from "./collection-query";
import {
  defaultGroupFilters,
  groupFilterParams,
  groupFiltersSchema,
  parseGroupFilters,
} from "./filters";
import { encodeGroupCursor, parseGroupCursor } from "./pagination";

const dialect = new PgDialect();
describe("Groups library filters", () => {
  it("round-trips search and role through the URL", () => {
    const filters = groupFiltersSchema.parse({
      q: "  Friday crew  ",
      role: "owner",
    });
    expect(parseGroupFilters(groupFilterParams(filters)).data).toEqual({
      q: "Friday crew",
      role: "owner",
    });
    expect(groupFilterParams(defaultGroupFilters).size).toBe(0);
    expect(groupFiltersSchema.safeParse({ role: "organizing" }).success).toBe(
      false
    );
  });
  it.each(["any", "owner", "member"] as const)(
    "scopes %s results to the viewer before pagination",
    (role) => {
      const query = dialect.sqlToQuery(
        groupCollectionCondition("viewer", { role, q: "100%_crew" })!
      );
      expect(query.sql).toContain('"group_members"."user_id" =');
      expect(query.params).toContain("viewer");
      expect(query.params).toContain("%100\\%\\_crew%");
      if (role === "owner")
        expect(query.sql).toContain('"groups"."owner_id" =');
      if (role === "member")
        expect(query.sql).toContain('"groups"."owner_id" <>');
    }
  );
  it("uses unended publicized games for priority and session updates for activity", () => {
    const order = groupCollectionOrder(new Date("2026-09-01T00:00:00Z"));
    const priority = dialect.sqlToQuery(order.upcoming);
    expect(priority.sql).toContain("'published', 'live'");
    expect(priority.sql).toContain('"sessions"."ends_at" >');
    expect(priority.params).toContain("2026-09-01T00:00:00.000Z");
    expect(dialect.sqlToQuery(order.activity).sql).toContain(
      'max("sessions"."updated_at")'
    );
  });
  it("binds cursor metadata to the viewer and filters", () => {
    const context = groupFilterContext("viewer", defaultGroupFilters);
    expect(context).not.toBe(groupFilterContext("other", defaultGroupFilters));
    expect(context).not.toBe(
      groupFilterContext("viewer", { q: "crew", role: "owner" })
    );
    const cursor = {
      at: new Date("2026-09-01T00:00:00Z"),
      id: "dff6643b-4159-49b4-b2a3-6787f7f4c0a1",
      upcoming: true,
      context,
      snapshot: "2026-09-01T00:00:00.000Z",
    };
    expect(parseGroupCursor(encodeGroupCursor(cursor))).toEqual(cursor);
  });
});

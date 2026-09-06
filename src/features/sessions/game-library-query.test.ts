import { PgDialect } from "drizzle-orm/pg-core";
import { describe, expect, it } from "vitest";
import { defaultGameLibraryFilters } from "./game-library-filters";
import {
  gameLibraryConditions,
  gameLibraryMembership,
  gameLibraryPhase,
} from "./game-library-query";

const dialect = new PgDialect();
const userId = "b07a50cf-8ba7-452e-a421-ab264c9b7e6e";
const now = new Date("2026-08-01T00:00:00Z");

describe("authorized Games library SQL", () => {
  it("scopes both facets and results to the account and excludes removed memberships and drafts", () => {
    const query = dialect.sqlToQuery(gameLibraryMembership(userId)!);
    expect(query.sql).toContain('"session_players"."user_id" =');
    expect(query.sql).toContain('"session_players"."left_at" is null');
    expect(query.params).toContain(userId);
    expect(query.params).not.toContain("draft");
    expect(query.params).toContain("completed");
    expect(query.params).toContain("cancelled");
  });
  it("searches title, venue and host with escaped parameters inside authorization", () => {
    const query = dialect.sqlToQuery(
      gameLibraryConditions(
        userId,
        { ...defaultGameLibraryFilters, q: "100%_club", when: "all" },
        now
      )!
    );
    expect(query.sql).toContain('"sessions"."title" ilike');
    expect(query.sql).toContain('"sessions"."venue_name" ilike');
    expect(query.sql).toContain('"profiles"."name" ilike');
    expect(query.sql).toContain('"profiles"."user_id" = "sessions"."host_id"');
    expect(query.params).toContain("%100\\%\\_club%");
    expect(query.params).toContain(userId);
    expect(query.sql).not.toContain("100%");
  });
  it("filters response independently from organizer role and combines group/venue predicates", () => {
    const query = dialect.sqlToQuery(
      gameLibraryConditions(
        userId,
        {
          ...defaultGameLibraryFilters,
          role: "cohost",
          response: "declined",
          group: "none",
          venue: "Central",
          when: "all",
          cancelled: "true",
        },
        now
      )!
    );
    expect(query.sql).toContain('"sessions"."group_id" is null');
    expect(query.sql).toContain('"sessions"."venue_name" =');
    expect(query.params).toContain("cohost");
    expect(query.params).toContain("declined");
    expect(query.params).toContain("Central");
  });
  it("uses inclusive game-local dates without a rolling history cap", () => {
    const query = dialect.sqlToQuery(
      gameLibraryConditions(
        userId,
        {
          ...defaultGameLibraryFilters,
          when: "range",
          from: "2020-01-01",
          until: "2020-01-01",
        },
        now
      )!
    );
    expect(query.sql).toContain('at time zone "sessions"."timezone")::date >=');
    expect(query.sql).toContain('at time zone "sessions"."timezone")::date <=');
    expect(query.params.filter((value) => value === "2020-01-01")).toHaveLength(
      2
    );
    expect(query.params).not.toContain(now);
  });
  it("fails closed for incomplete and reversed ranges", () => {
    const query = dialect.sqlToQuery(
      gameLibraryConditions(
        userId,
        { ...defaultGameLibraryFilters, when: "range" },
        now
      )!
    );
    expect(query.sql).toContain("false");
  });
  it("keeps completed and cancelled in past and unended published/live games upcoming", () => {
    const upcoming = dialect.sqlToQuery(gameLibraryPhase("upcoming", now)!);
    const past = dialect.sqlToQuery(gameLibraryPhase("past", now)!);
    expect(upcoming.params).toContain("live");
    expect(upcoming.params).not.toContain("completed");
    expect(past.params).toContain("completed");
    expect(past.params).toContain("cancelled");
    expect(upcoming.sql).toContain('"sessions"."ends_at" >');
    expect(past.sql).toContain('"sessions"."ends_at" <=');
  });
});

import { describe, expect, it } from "vitest";
import {
  defaultGameLibraryFilters,
  gameLibraryFilterSchema,
  gameLibraryRangeError,
  gameLibrarySearchParams,
  parseGameLibraryFilters,
} from "./game-library-filters";

describe("Games library URL contract", () => {
  it("defaults to upcoming, any role and excludes cancelled", () => {
    expect(parseGameLibraryFilters(new URLSearchParams()).data).toEqual(
      defaultGameLibraryFilters
    );
    expect(defaultGameLibraryFilters).toMatchObject({
      when: "upcoming",
      role: "any",
      response: "any",
      cancelled: "false",
    });
    expect(gameLibrarySearchParams(defaultGameLibraryFilters).toString()).toBe(
      ""
    );
  });
  it("round trips every filter without calendar or invite state changing the library", () => {
    const filters = gameLibraryFilterSchema.parse({
      q: " Mika ",
      when: "range",
      from: "2026-08-01",
      until: "2026-08-31",
      role: "cohost",
      response: "declined",
      group: "none",
      venue: "Central Pickle",
      cancelled: "true",
    });
    const params = gameLibrarySearchParams(filters);
    params.set("filter", "invites");
    params.set("month", "2026-09");
    expect(parseGameLibraryFilters(params).data).toEqual(filters);
    expect(filters.q).toBe("Mika");
  });
  it("keeps old Past bookmarks and invitation deep links", () => {
    expect(
      parseGameLibraryFilters(new URLSearchParams("filter=past")).data?.when
    ).toBe("past");
    expect(
      parseGameLibraryFilters(new URLSearchParams("filter=invites")).data
    ).toEqual(defaultGameLibraryFilters);
  });
  it.each(["2026-02-30", "2026-13-01", "yesterday"])(
    "rejects invalid dates: %s",
    (from) => {
      expect(
        gameLibraryFilterSchema.safeParse({ when: "range", from }).success
      ).toBe(false);
    }
  );
  it("requires two ordered inclusive bounds, allowing a single day", () => {
    const filters = { ...defaultGameLibraryFilters, when: "range" as const };
    expect(gameLibraryRangeError(filters)).toContain("both");
    expect(
      gameLibraryRangeError({
        ...filters,
        from: "2026-08-03",
        until: "2026-08-02",
      })
    ).toContain("on or after");
    expect(
      gameLibraryRangeError({
        ...filters,
        from: "2026-08-03",
        until: "2026-08-03",
      })
    ).toBeNull();
  });
  it.each([
    { role: "admin" },
    { group: "other-crew" },
    { q: "x".repeat(201) },
    { cancelled: "yes" },
    { response: "accepted" },
  ])("rejects unsupported filters %j", (values) => {
    expect(gameLibraryFilterSchema.safeParse(values).success).toBe(false);
  });
});

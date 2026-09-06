import { PgDialect } from "drizzle-orm/pg-core";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ findFirst: vi.fn() }));
vi.mock("server-only", () => ({}));
vi.mock("@/db/client", () => ({
  db: { query: { productEvents: { findFirst: mocks.findFirst } } },
}));

import {
  createdGameDismissalKey,
  shouldShowCreatedGameShare,
} from "./created-game-share-query";

const input = {
  userId: "host-1",
  sessionId: "game-1",
  status: "published",
  canManage: true,
};

beforeEach(() => {
  vi.clearAllMocks();
  mocks.findFirst.mockResolvedValue(undefined);
});

describe("shouldShowCreatedGameShare", () => {
  it("keeps showing on repeated Overview loads without a URL marker", async () => {
    expect(await shouldShowCreatedGameShare(input)).toBe(true);
    expect(await shouldShowCreatedGameShare(input)).toBe(true);
  });

  it("remembers dismissal across loads only for the matching account and game", async () => {
    const dismissedKey = createdGameDismissalKey(input.userId, input.sessionId);
    const dialect = new PgDialect();
    mocks.findFirst.mockImplementation(({ where }) => {
      const { params } = dialect.sqlToQuery(where);
      return params.includes(dismissedKey) ? { id: "dismissal" } : undefined;
    });
    expect(await shouldShowCreatedGameShare(input)).toBe(false);
    expect(await shouldShowCreatedGameShare(input)).toBe(false);
    expect(
      await shouldShowCreatedGameShare({ ...input, userId: "cohost-2" })
    ).toBe(true);
    expect(
      await shouldShowCreatedGameShare({ ...input, sessionId: "game-2" })
    ).toBe(true);
  });

  it.each(["draft", "live", "completed", "cancelled"])(
    "does not show the creation banner for a %s game",
    async (status) => {
      expect(await shouldShowCreatedGameShare({ ...input, status })).toBe(
        false
      );
      expect(mocks.findFirst).not.toHaveBeenCalled();
    }
  );

  it("never shows management guidance to a player or guest", async () => {
    expect(
      await shouldShowCreatedGameShare({ ...input, canManage: false })
    ).toBe(false);
    expect(mocks.findFirst).not.toHaveBeenCalled();
  });
});

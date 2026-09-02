import { existsSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

const gamesRoute = join(process.cwd(), "src/app/(app)/games");

describe("Games loading boundaries", () => {
  it("scopes the games-list fallback so it cannot wrap a game workspace layout", () => {
    expect(existsSync(join(gamesRoute, "loading.tsx"))).toBe(false);
    expect(existsSync(join(gamesRoute, "(list)/loading.tsx"))).toBe(true);
    expect(existsSync(join(gamesRoute, "(list)/page.tsx"))).toBe(true);
  });
});

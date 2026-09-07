import { existsSync } from "node:fs";
import { dirname, join } from "node:path";

import { describe, expect, it } from "vitest";

const surfaces = [
  {
    name: "authenticated",
    root: "src/app/(app)/games/[id]",
    overview: "(overview)",
  },
  { name: "shared link", root: "src/app/s/[slug]", overview: "(plan)" },
];
const tabs = ["players", "play", "chat", "payments", "story"];

// Next's loading.tsx wraps its page and every descendant. Component snapshots
// alone cannot detect an Overview fallback placed above sibling tab boundaries.
function loadingBoundaries(root: string, directory: string) {
  const boundaries: string[] = [];
  let current = directory;
  while (true) {
    const loading = join(current, "loading.tsx");
    if (existsSync(loading)) boundaries.push(loading);
    if (current === root) return boundaries;
    current = dirname(current);
  }
}

describe.each(surfaces)(
  "$name game loading boundaries",
  ({ root, overview }) => {
    const workspace = join(process.cwd(), root);

    it("scopes Overview to a URL-transparent leaf while keeping the shared layout", () => {
      expect(existsSync(join(workspace, "layout.tsx"))).toBe(true);
      expect(existsSync(join(workspace, overview, "page.tsx"))).toBe(true);
      expect(loadingBoundaries(workspace, join(workspace, overview))).toEqual([
        join(workspace, overview, "loading.tsx"),
      ]);
      expect(existsSync(join(workspace, "page.tsx"))).toBe(false);
    });

    it.each(tabs)(
      "%s inherits only its own game-content loading state, never Overview",
      (tab) => {
        expect(loadingBoundaries(workspace, join(workspace, tab))).toEqual([
          join(workspace, tab, "loading.tsx"),
        ]);
      }
    );
  }
);

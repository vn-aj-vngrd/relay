import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const read = (path: string) => readFileSync(path, "utf8");

describe("game tab spacing ownership", () => {
  it.each(["(plan)", "play", "chat", "payments", "story"])(
    "keeps the shared %s route and loading state on the common inset",
    (tab) => {
      for (const file of ["page", "loading"]) {
        const source = read(`src/app/s/[slug]/${tab}/${file}.tsx`);
        expect(source).toContain("game-tab-content");
        const containers = source.match(
          /className="[^"]*game-tab-content[^"]*"/g
        );
        expect(containers?.length).toBeGreaterThan(0);
        for (const container of containers ?? []) {
          expect(container).not.toMatch(/(?:^|\s)(?:sm:)?p[ty]-\d/);
        }
      }
    }
  );

  it("assigns the authenticated inset to the frame instead of the roster", () => {
    expect(read("src/features/sessions/game-workspace-frame.tsx")).toContain(
      "game-workspace-content game-tab-content"
    );
    expect(read("src/features/sessions/play-roster-surface.tsx")).toContain(
      'className={ended ? "py-5" : "pb-5"}'
    );
    expect(read("src/features/sessions/overview-loading-state.tsx")).toContain(
      "game-tab-content"
    );
  });
});

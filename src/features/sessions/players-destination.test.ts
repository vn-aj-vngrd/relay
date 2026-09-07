import { describe, expect, it } from "vitest";

import { playersDestination, rosterPanelUrl } from "./players-destination";

describe("Players destinations", () => {
  it.each(["/games/game-1", "/s/shared-game"])(
    "preserves repeated query context and replaces panel intent for %s",
    (base) => {
      expect(
        playersDestination(base, {
          source: ["invite", "notification"],
          panel: "old",
          guest: "opaque",
        })
      ).toBe(
        `${base}/play?source=invite&source=notification&panel=players&guest=opaque`
      );
    }
  );
  it("changes only roster intent and preserves the hash", () => {
    expect(
      rosterPanelUrl("https://relay.test/games/1/play?from=home#court-2", true)
    ).toBe("/games/1/play?from=home&panel=players#court-2");
    expect(
      rosterPanelUrl(
        "https://relay.test/games/1/play?from=home&panel=players#court-2",
        false
      )
    ).toBe("/games/1/play?from=home#court-2");
    expect(
      rosterPanelUrl("https://relay.test/games/1/play?panel=other", false)
    ).toBe("/games/1/play?panel=other");
  });
});

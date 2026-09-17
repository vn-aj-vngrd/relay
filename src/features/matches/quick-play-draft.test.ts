import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { loadQuickPlayDraft, quickPlayDraftKey } from "./quick-play-draft";
import {
  readQuickPlayStorage,
  writeQuickPlayStorage,
} from "./quick-play-storage";

const stored = new Map<string, string>();
beforeEach(() => {
  stored.clear();
  vi.stubGlobal("localStorage", {
    getItem: (key: string) => stored.get(key) ?? null,
    setItem: (key: string, value: string) => stored.set(key, value),
    removeItem: (key: string) => stored.delete(key),
  });
});
afterEach(() => vi.unstubAllGlobals());

const draft = {
  step: 2,
  players: ["Alex", "Blair", "Casey", "Drew"].map((name) => ({
    id: name,
    name,
    experience: "casual",
  })),
  pairOrder: ["Alex", "Blair", "Casey", "Drew"],
  courtCountInput: "1",
  mode: "balanced",
  queueRule: "adaptive",
  roundDuration: "10",
  partnerPolicy: "mix",
};

describe("Quick Play draft recovery", () => {
  it("restores names, pair order, choices and step", () => {
    localStorage.setItem(quickPlayDraftKey, JSON.stringify(draft));
    expect(loadQuickPlayDraft().draft).toEqual(draft);
  });

  it("rejects corrupt or inconsistent saved players", () => {
    for (const value of [
      "broken",
      JSON.stringify({
        ...draft,
        pairOrder: ["Alex", "Alex", "Casey", "Drew"],
      }),
    ]) {
      localStorage.setItem(quickPlayDraftKey, value);
      expect(loadQuickPlayDraft().draft).toBeNull();
      expect(loadQuickPlayDraft().restoreWarning).toContain(
        "could not be restored"
      );
    }
  });

  it("returns incomplete names to Players instead of bypassing validation", () => {
    localStorage.setItem(
      quickPlayDraftKey,
      JSON.stringify({
        ...draft,
        players: draft.players.map((player) => ({ ...player, name: "" })),
      })
    );
    expect(loadQuickPlayDraft().draft?.step).toBe(1);
  });

  it("reports unavailable storage without throwing", () => {
    vi.stubGlobal("localStorage", {
      getItem: () => {
        throw new Error("Blocked");
      },
      setItem: () => {
        throw new Error("Full");
      },
      removeItem: () => {
        throw new Error("Blocked");
      },
    });
    expect(readQuickPlayStorage("session").warning).toContain("couldn’t save");
    expect(writeQuickPlayStorage("session", "value")).toContain(
      "couldn’t save"
    );
    expect(writeQuickPlayStorage("session", null)).toContain("couldn’t save");
    expect(loadQuickPlayDraft().draft).toBeNull();
  });
});

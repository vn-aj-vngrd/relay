import { describe, expect, it } from "vitest";
import {
  creationForm,
  creationInputSchema,
  validateCreation,
} from "./creation-schema";

const now = new Date("2026-09-16T00:00:00Z");
const game = {
  kind: "game",
  title: "Friday game",
  venue: "Cebu court",
  date: "2026-09-18",
  start: "18:00",
  end: "20:00",
  capacity: 8,
  courts: 1,
};
describe("Agent creation drafts", () => {
  it("keeps an incomplete conversation from becoming a created draft", () => {
    const input = creationInputSchema.parse({ kind: "game", intent: "draft" });
    expect(validateCreation(input, now).length).toBeGreaterThan(0);
  });
  it("uses the same future-time and capacity rules as the game form", () => {
    expect(validateCreation(creationInputSchema.parse(game), now)).toEqual([]);
    expect(
      validateCreation(
        creationInputSchema.parse({ ...game, end: "17:00" }),
        now
      )
    ).toContain("End time must be after start time.");
    expect(
      validateCreation(
        creationInputSchema.parse({ ...game, date: "2026-09-15" }),
        now
      )
    ).toContain("Start time must be in the future.");
    expect(
      creationInputSchema.safeParse({ ...game, capacity: 41 }).success
    ).toBe(false);
  });
  it("preserves payment intent without inventing charges", () => {
    const input = creationInputSchema.parse({
      ...game,
      costKind: "collect",
      hostPlaying: false,
    });
    expect(validateCreation(input, now)).toEqual([]);
    const form = creationForm(input, "request-id");
    expect(form.get("costKind")).toBe("collect");
    expect(form.get("hostPlaying")).toBe("no");
    expect(form.has("total")).toBe(false);
    expect(form.get("creationKey")).toBe("request-id");
  });
  it("retains group name bounds and source identity", () => {
    expect(
      validateCreation(
        creationInputSchema.parse({ kind: "group", title: "A" }),
        now
      ).length
    ).toBeGreaterThan(0);
    const input = creationInputSchema.parse({
      kind: "group",
      title: "Friday crew",
      description: "Weekly games",
    });
    expect(validateCreation(input, now)).toEqual([]);
    expect(creationForm(input, "request").get("name")).toBe("Friday crew");
  });
  it("requires unambiguous Quick Play players and supported court counts", () => {
    const input = creationInputSchema.parse({
      kind: "quickPlay",
      players: ["A", "B", "C", "D"],
      courts: 1,
    });
    expect(validateCreation(input)).toEqual([]);
    expect(validateCreation({ ...input, courts: 7 }).length).toBeGreaterThan(0);
    expect(validateCreation({ ...input, courts: 2 })).toContain(
      "Add 4 more players for 2 courts."
    );
    expect(
      validateCreation({
        ...input,
        mode: "king_of_court",
        players: ["A", "B", "C", "D", "E"],
      })
    ).toContain("Court Climb needs exactly four players per court.");
    expect(
      validateCreation({ ...input, players: ["A", "a", "C", "D"] }).length
    ).toBeGreaterThan(0);
  });
  it("rejects model-supplied authority, payment details and execution fields", () => {
    for (const field of [
      "userId",
      "approved",
      "destination",
      "paymentAccountId",
      "execute",
    ])
      expect(
        creationInputSchema.safeParse({ ...game, [field]: "forged" }).success
      ).toBe(false);
  });
});

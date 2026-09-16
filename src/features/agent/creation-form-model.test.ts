import { describe, expect, it } from "vitest";
import {
  applyReplaySource,
  creationFieldErrors,
  creationSteps,
  inputForCreation,
  type ReplaySource,
} from "./creation-form-model";
import {
  creationForm,
  creationInputSchema,
  validateCreation,
} from "./creation-schema";

describe("Guided creation steps", () => {
  const sourceA = {
    id: "a",
    title: "Morning game",
    venue: "Court A",
    capacity: 8,
    courts: 1,
  };
  const sourceB = {
    id: "b",
    title: "Evening game",
    venue: "Court B",
    capacity: 16,
    courts: 2,
  };
  it("refreshes replay defaults when choosing a different source", () => {
    const first = applyReplaySource(
      inputForCreation("replay"),
      undefined,
      sourceA
    );
    expect(applyReplaySource(first, sourceA, sourceB)).toMatchObject({
      sourceSessionId: "b",
      title: "Evening game",
      venue: "Court B",
      capacity: 16,
      courts: 2,
    });
  });
  it("preserves supplied and edited values when changing replay sources", () => {
    const first = applyReplaySource(
      { ...inputForCreation("replay"), title: "My custom game" },
      undefined,
      sourceA
    );
    const edited = {
      ...first,
      venue: "My court",
      venueId: "court-id",
      capacity: 12,
    };
    expect(applyReplaySource(edited, sourceA, sourceB)).toMatchObject({
      title: "My custom game",
      venue: "My court",
      venueId: "court-id",
      capacity: 12,
      courts: 2,
      sourceSessionId: "b",
    });
  });
  it("clears source defaults on deselection so another source can prefill them", () => {
    const first = applyReplaySource(
      inputForCreation("replay"),
      undefined,
      sourceA
    );
    const cleared = applyReplaySource(first, sourceA, undefined);
    expect(cleared.sourceSessionId).toBeUndefined();
    expect(cleared.title).toBeUndefined();
    expect(applyReplaySource(cleared, undefined, sourceB)).toMatchObject({
      title: "Evening game",
      venue: "Court B",
      capacity: 16,
      courts: 2,
    });
  });
  it("replays venue identity, eligible group, access, color and time defaults", () => {
    const source: ReplaySource = {
      ...sourceA,
      venueId: "venue-a",
      venueAddress: "Cebu City",
      replayGroupId: "group-a",
      visibility: "private",
      requiresApproval: true,
      accentColor: "teal",
      start: "18:00",
      end: "20:00",
    };
    const result = applyReplaySource(
      inputForCreation("replay"),
      undefined,
      source
    );
    expect(result).toMatchObject({
      venueId: "venue-a",
      venueAddress: "Cebu City",
      groupId: "group-a",
      visibility: "private",
      requiresApproval: true,
      accentColor: "teal",
      start: "18:00",
      end: "20:00",
    });
    expect(result.date).toBeUndefined();
    const form = creationForm(result, "proposal");
    expect(form.get("groupId")).toBe("group-a");
    expect(form.get("accentColor")).toBe("teal");
    expect(form.get("requiresApproval")).toBe("on");
    const replaced = applyReplaySource(result, source, {
      ...sourceB,
      replayGroupId: null,
      visibility: "link",
      requiresApproval: false,
      accentColor: "blue",
      start: "09:00",
      end: "11:00",
    });
    expect(replaced).toMatchObject({
      groupId: undefined,
      venueId: undefined,
      venueAddress: undefined,
      visibility: "link",
      requiresApproval: false,
      accentColor: "blue",
      start: "09:00",
      end: "11:00",
    });
  });
  it("preserves explicitly different replay access and time edits", () => {
    const source: ReplaySource = {
      ...sourceA,
      visibility: "private",
      requiresApproval: true,
      accentColor: "teal",
      start: "18:00",
      end: "20:00",
      replayGroupId: "group-a",
    };
    const result = applyReplaySource(
      {
        ...applyReplaySource(inputForCreation("replay"), undefined, source),
        visibility: "public",
        requiresApproval: false,
        start: "17:00",
        accentColor: "coral",
        groupId: "custom-group",
      },
      source,
      { ...sourceB, visibility: "link", requiresApproval: true }
    );
    expect(result).toMatchObject({
      visibility: "public",
      requiresApproval: false,
      start: "17:00",
      accentColor: "coral",
      groupId: "custom-group",
    });
    expect(inputForCreation("replay").accentColor).toBeUndefined();
    expect(
      creationInputSchema.safeParse({ kind: "game", accentColor: "pink" })
        .success
    ).toBe(false);
  });
  it.each([
    ["game", ["details", "settings"]],
    ["draft", ["details", "settings"]],
    ["replay", ["source", "details", "settings"]],
    ["groupGame", ["source", "details", "settings"]],
    ["group", ["details"]],
    ["crew", ["source", "details"]],
    ["quickPlay", ["players", "settings"]],
  ] as const)("uses focused steps for %s", (flow, steps) => {
    expect(creationSteps(inputForCreation(flow))).toEqual(steps);
  });
  it("attaches missing and invalid game details to named fields", () => {
    const input = inputForCreation("game");
    expect(creationFieldErrors(input, "details")).toMatchObject({
      title: expect.any(String),
      venue: expect.any(String),
      date: expect.any(String),
      start: expect.any(String),
      end: expect.any(String),
    });
    expect(
      creationFieldErrors(
        { ...input, date: "2030-10-01", start: "18:00", end: "17:00" },
        "details",
        new Date("2030-09-01")
      )
    ).toHaveProperty("end");
  });
  it("keeps drafts as drafts and requires source selection for contextual flows", () => {
    expect(inputForCreation("draft").intent).toBe("draft");
    for (const flow of ["replay", "crew", "groupGame"] as const) {
      const input = inputForCreation(flow);
      expect(Object.keys(creationFieldErrors(input, "source"))).toHaveLength(1);
      expect(validateCreation(input).length).toBeGreaterThan(0);
    }
  });
  it("uses the Quick Play rules before allowing review", () => {
    const input = {
      ...inputForCreation("quickPlay"),
      players: ["A", "B", "C", "D"],
      courts: 2,
    };
    expect(creationFieldErrors(input, "settings").courts).toContain(
      "Add 4 more players"
    );
  });
});

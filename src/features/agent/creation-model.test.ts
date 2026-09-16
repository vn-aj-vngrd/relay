import { describe, expect, it } from "vitest";
import {
  applyReplaySource,
  inputForCreation,
  type ReplaySource,
} from "./creation-model";
import { creationForm, creationInputSchema } from "./creation-schema";

describe("Creation source defaults", () => {
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
});

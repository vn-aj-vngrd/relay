import { describe, expect, it } from "vitest";
import { inputForCreation } from "./creation-model";
import { creationProgress } from "./creation-progress";

describe("Conversational creation progress", () => {
  it("tracks supplied details and skips them when identifying the next question", () => {
    expect(
      creationProgress({
        ...inputForCreation("game"),
        title: "Friday game",
        date: "2030-10-01",
      })
    ).toEqual({ completed: 2, total: 7, next: "Court" });
  });
  it.each(["replay", "crew", "groupGame"] as const)(
    "includes the required source for %s",
    (flow) => {
      expect(creationProgress(inputForCreation(flow)).next).toBe(
        flow === "groupGame" ? "Group" : "Previous game"
      );
    }
  );
  it("does not count default optional settings as unanswered questions", () => {
    expect(
      creationProgress({ ...inputForCreation("group"), title: "Friday crew" })
    ).toEqual({ completed: 1, total: 1, next: null });
    expect(
      creationProgress({
        ...inputForCreation("quickPlay"),
        players: ["A", "B", "C", "D"],
      })
    ).toEqual({ completed: 1, total: 2, next: "Courts" });
  });
});

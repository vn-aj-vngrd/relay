import { describe, expect, it } from "vitest";
import { inputForCreation } from "./creation-form-model";
import { creationQuestions, questionErrors } from "./creation-questions";

describe("Focused creation questions", () => {
  it("separates game answers into small steps", () => {
    expect(creationQuestions(inputForCreation("game"))).toEqual([
      "name",
      "court",
      "schedule",
      "roster",
      "access",
      "payment",
      "finish",
    ]);
    expect(questionErrors(inputForCreation("game"), "name")).toEqual({
      title: "Enter a game name.",
    });
    expect(questionErrors(inputForCreation("game"), "court")).toEqual({
      venue: "Enter a court.",
    });
  });
  it("only includes relevant questions for groups and local Quick Play", () => {
    expect(creationQuestions(inputForCreation("group"))).toEqual(["name"]);
    expect(creationQuestions(inputForCreation("crew"))).toEqual([
      "source",
      "name",
    ]);
    expect(creationQuestions(inputForCreation("quickPlay"))).toEqual([
      "players",
      "courts",
      "format",
    ]);
  });
});

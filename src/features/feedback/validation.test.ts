import { describe, expect, it } from "vitest";

import { submitFeedbackSchema, updateFeedbackSchema } from "./validation";

describe("submitFeedbackSchema", () => {
  it("accepts a useful bug report", () => {
    const result = submitFeedbackSchema.safeParse({
      type: "bug",
      area: "play",
      title: "Score button stopped responding",
      description: "The plus button stopped after I expanded the scoreboard.",
      pagePath: "/games/abc/play",
      contactAllowed: true,
    });

    expect(result.success).toBe(true);
  });

  it("rejects vague, oversized, and external submissions", () => {
    const result = submitFeedbackSchema.safeParse({
      type: "feature",
      area: "general",
      title: "Idea",
      description: "Too short",
      pagePath: "https://example.com/private",
      contactAllowed: false,
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      const fields = result.error.flatten().fieldErrors;
      expect(fields.title).toBeDefined();
      expect(fields.description).toBeDefined();
      expect(fields.pagePath).toBeDefined();
    }
  });
});

describe("updateFeedbackSchema", () => {
  it("limits admin updates to known lifecycle states", () => {
    expect(
      updateFeedbackSchema.safeParse({
        feedbackId: "8768e5bf-25aa-4c4f-9cdf-6fcdb78b9c75",
        status: "planned",
        adminNote: "Useful once the core queue is stable.",
      }).success,
    ).toBe(true);
    expect(
      updateFeedbackSchema.safeParse({
        feedbackId: "8768e5bf-25aa-4c4f-9cdf-6fcdb78b9c75",
        status: "shipped-someday",
        adminNote: "",
      }).success,
    ).toBe(false);
  });
});

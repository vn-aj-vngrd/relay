import { describe, expect, it } from "vitest";

import { sessionMilestoneDedupeKey } from "./milestones";

describe("sessionMilestoneDedupeKey", () => {
  it("is stable across retries and distinct across games and milestones", () => {
    const sessionId = "2ff78d38-32bb-41a4-bbaf-aa7bbb324c44";

    expect(sessionMilestoneDedupeKey(sessionId, "play_started")).toBe(
      sessionMilestoneDedupeKey(sessionId, "play_started")
    );
    expect(sessionMilestoneDedupeKey(sessionId, "play_started")).not.toBe(
      sessionMilestoneDedupeKey(sessionId, "session_completed")
    );
    expect(sessionMilestoneDedupeKey(sessionId, "play_started")).not.toBe(
      sessionMilestoneDedupeKey(
        "f056590e-af85-4ad7-86af-f830cf475228",
        "play_started"
      )
    );
  });
});

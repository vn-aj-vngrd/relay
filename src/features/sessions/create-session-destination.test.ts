import { describe, expect, it } from "vitest";

import { createSessionDestination } from "./create-session-destination";

describe("createSessionDestination", () => {
  it("marks only a newly published game for the one-time share prompt", () => {
    expect(createSessionDestination("session-1", true)).toBe(
      "/games/session-1?created=1"
    );
    expect(createSessionDestination("session-1", false)).toBe(
      "/games/session-1"
    );
  });
});

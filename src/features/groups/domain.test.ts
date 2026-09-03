import { describe, expect, it } from "vitest";

import {
  addGroupMemberSchema,
  createGroupSchema,
  updateGroupSchema,
} from "./domain";

describe("group validation", () => {
  it("keeps group creation lightweight", () => {
    expect(
      createGroupSchema.safeParse({ name: "Tuesday Dink Club" }).success
    ).toBe(true);
    expect(createGroupSchema.safeParse({ name: "T" }).success).toBe(false);
    expect(
      createGroupSchema.safeParse({
        name: "Tuesday Dink Club",
        description: "x".repeat(301),
      }).success
    ).toBe(false);
  });

  it("validates owner edits with the same group detail limits", () => {
    expect(
      updateGroupSchema.safeParse({
        groupId: "59c6fa3f-3f6f-45f2-bbea-b85bc90aa3a7",
        name: "Tuesday Dink Club",
        removeImage: false,
      }).success
    ).toBe(true);
    expect(
      updateGroupSchema.safeParse({
        groupId: "59c6fa3f-3f6f-45f2-bbea-b85bc90aa3a7",
        name: "T",
        removeImage: false,
      }).success
    ).toBe(false);
  });

  it("normalizes usernames before adding members", () => {
    const result = addGroupMemberSchema.parse({
      groupId: "59c6fa3f-3f6f-45f2-bbea-b85bc90aa3a7",
      username: "  Mika_Reyes ",
    });
    expect(result.username).toBe("mika_reyes");
  });
});

import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("./actions", () => ({
  setAllAttendanceAction: vi.fn(async () => ({ success: true })),
  setAttendanceAction: vi.fn(async () => ({ success: true })),
}));

import { AttendanceBulkActions, AttendanceToggle } from "./attendance-toggle";

const props = {
  sessionId: "59c6fa3f-3f6f-45f2-bbea-b85bc90aa3a7",
  sessionPlayerId: "6ed176fa-7f97-4aec-bd40-0842284b5551",
  name: "Mika",
};

describe("AttendanceBulkActions", () => {
  it("makes the bulk arrival change explicit", () => {
    const { rerender } = render(<AttendanceBulkActions sessionId={props.sessionId} allPresent={false} />);
    expect(screen.getByRole("button", { name: "Mark all here" })).toBeVisible();

    rerender(<AttendanceBulkActions sessionId={props.sessionId} allPresent />);
    expect(screen.getByRole("button", { name: "Mark all not here" })).toBeVisible();
  });
});

describe("AttendanceToggle", () => {
  it("makes the next arrival state explicit", () => {
    const { rerender } = render(<AttendanceToggle {...props} present={false} />);
    expect(screen.getByRole("button", { name: "Mark Mika as here" })).toHaveTextContent("Not here");
    rerender(<AttendanceToggle {...props} present />);
    expect(screen.getByRole("button", { name: "Mark Mika as not here" })).toHaveTextContent("Here");
  });
});

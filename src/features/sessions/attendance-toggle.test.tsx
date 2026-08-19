import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("./actions", () => ({ setAttendanceAction: vi.fn(async () => ({ success: true })) }));

import { AttendanceToggle } from "./attendance-toggle";

const props = {
  sessionId: "59c6fa3f-3f6f-45f2-bbea-b85bc90aa3a7",
  sessionPlayerId: "6ed176fa-7f97-4aec-bd40-0842284b5551",
  name: "Mika",
};

describe("AttendanceToggle", () => {
  it("makes the next arrival state explicit", () => {
    const { rerender } = render(<AttendanceToggle {...props} present={false} />);
    expect(screen.getByRole("button", { name: "Mark Mika as here" })).toHaveTextContent("Not here");
    rerender(<AttendanceToggle {...props} present />);
    expect(screen.getByRole("button", { name: "Mark Mika as not here" })).toHaveTextContent("Here");
  });
});

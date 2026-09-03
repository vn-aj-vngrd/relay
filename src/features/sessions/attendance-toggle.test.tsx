import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("./actions", () => ({
  setAllAttendanceAction: vi.fn(async () => ({ success: true })),
  setAttendanceAction: vi.fn(async () => ({ success: true })),
  setPlayAvailabilityAction: vi.fn(async () => ({ success: true })),
}));

import {
  AttendanceBulkActions,
  AttendanceToggle,
  PlayAvailabilityControl,
} from "./attendance-toggle";

const props = {
  sessionId: "59c6fa3f-3f6f-45f2-bbea-b85bc90aa3a7",
  sessionPlayerId: "6ed176fa-7f97-4aec-bd40-0842284b5551",
  name: "Mika",
};

describe("AttendanceBulkActions", () => {
  it("makes the bulk arrival change explicit", () => {
    const { rerender } = render(
      <AttendanceBulkActions sessionId={props.sessionId} allPresent={false} />
    );
    expect(screen.getByRole("button", { name: "Mark all here" })).toBeVisible();

    rerender(<AttendanceBulkActions sessionId={props.sessionId} allPresent />);
    expect(
      screen.getByRole("button", { name: "Mark all not here" })
    ).toBeVisible();
  });
});

describe("PlayAvailabilityControl", () => {
  it("uses live-play language for waiting, resting, and active players", () => {
    const { rerender } = render(
      <PlayAvailabilityControl
        {...props}
        queueState="waiting"
        playerState="waiting"
      />
    );
    expect(screen.getByText("Waiting")).toBeVisible();
    expect(
      screen.getByRole("button", { name: "Sit out for Mika" })
    ).toBeVisible();

    rerender(
      <PlayAvailabilityControl
        {...props}
        queueState="resting"
        playerState="resting"
      />
    );
    expect(screen.getByText("Sitting out")).toBeVisible();
    expect(
      screen.getByRole("button", { name: "Rejoin queue for Mika" })
    ).toBeVisible();

    rerender(
      <PlayAvailabilityControl
        {...props}
        queueState="playing"
        playerState="playing"
      />
    );
    expect(screen.getByText("On court")).toBeVisible();
    expect(
      screen.getByRole("button", { name: "Sit out after match for Mika" })
    ).toBeVisible();
  });

  it("lets an active player cancel a deferred break", () => {
    render(
      <PlayAvailabilityControl
        {...props}
        queueState="playing"
        playerState="resting"
      />
    );
    expect(screen.getByText("Sitting out after match")).toBeVisible();
    expect(
      screen.getByRole("button", { name: "Stay in for Mika" })
    ).toBeVisible();
  });
});

describe("AttendanceToggle", () => {
  it("makes the next arrival state explicit", () => {
    const { rerender } = render(
      <AttendanceToggle {...props} present={false} />
    );
    expect(
      screen.getByRole("button", { name: "Mark Mika as here" })
    ).toHaveTextContent("Not here");
    rerender(<AttendanceToggle {...props} present />);
    expect(
      screen.getByRole("button", { name: "Mark Mika as not here" })
    ).toHaveTextContent("Here");
  });
});

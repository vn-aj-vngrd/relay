import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("./actions", () => ({
  addGuestPlayerAction: vi.fn(async () => ({})),
  approvePlayerAction: vi.fn(async () => ({})),
  removePlayerAction: vi.fn(async () => ({})),
  toggleRosterLockAction: vi.fn(async () => undefined),
}));

import { AddGuestPlayerForm, PendingPlayerActions, RosterLockButton } from "./player-roster-controls";

const sessionId = "59c6fa3f-3f6f-45f2-bbea-b85bc90aa3a7";
const playerId = "a9116aa9-1c24-449c-a65d-bd5b51523d2a";
afterEach(cleanup);

describe("player roster controls", () => {
  it("lets hosts add a friend without requiring an account", () => {
    render(<AddGuestPlayerForm sessionId={sessionId} />);
    expect(screen.getByPlaceholderText("Add a friend by name")).toBeRequired();
    expect(screen.getByRole("button", { name: /Add/ })).toBeEnabled();
  });

  it("keeps approval and rejection explicit", () => {
    render(<PendingPlayerActions sessionId={sessionId} playerId={playerId} />);
    expect(screen.getByRole("button", { name: "Approve" })).toBeVisible();
    expect(screen.getByRole("button", { name: "Reject" })).toBeVisible();
  });

  it("communicates roster lock state", () => {
    render(<RosterLockButton sessionId={sessionId} locked />);
    expect(screen.getByRole("button", { name: "Unlock roster" })).toBeVisible();
  });
});

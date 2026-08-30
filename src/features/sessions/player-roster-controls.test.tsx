import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";

vi.mock("./actions", () => ({
  addPlayerAction: vi.fn(async () => ({})),
  approvePlayerAction: vi.fn(async () => ({})),
  removePlayerAction: vi.fn(async () => ({})),
  toggleRosterLockAction: vi.fn(async () => ({})),
}));

import { addPlayerAction } from "./actions";
import { AddPlayerForm, RemovePlayerButton } from "./player-roster-controls";

beforeAll(() => {
  HTMLDialogElement.prototype.showModal = function showModal() {
    this.setAttribute("open", "");
  };
  HTMLDialogElement.prototype.close = function close() {
    this.removeAttribute("open");
  };
});
afterEach(cleanup);

describe("AddPlayerForm", () => {
  it("switches between adding a guest and inviting a Relay username", () => {
    render(<AddPlayerForm sessionId="59c6fa3f-3f6f-45f2-bbea-b85bc90aa3a7" />);

    const entry = screen.getByRole("textbox", { name: "Guest name or Relay username" });
    expect(screen.getByRole("button", { name: "Add" })).toBeVisible();
    expect(screen.getByRole("button", { name: "Guest playing experience" })).toBeEnabled();

    fireEvent.change(entry, { target: { value: "@mika" } });

    expect(screen.getByRole("button", { name: "Invite" })).toBeVisible();
    expect(screen.getByRole("button", { name: "Guest playing experience" })).toBeDisabled();
    expect(screen.getByText(/use @username to invite a Relay player/i)).toBeVisible();
  });

  it("clears a guest name after the guest is added", async () => {
    vi.mocked(addPlayerAction).mockResolvedValueOnce({ success: true, playerOutcome: "added" });
    render(<AddPlayerForm sessionId="59c6fa3f-3f6f-45f2-bbea-b85bc90aa3a7" />);

    const entry = screen.getByRole("textbox", { name: "Guest name or Relay username" });
    fireEvent.change(entry, { target: { value: "Mika Reyes" } });
    fireEvent.click(screen.getByRole("button", { name: "Add" }));

    await waitFor(() => expect(entry).toHaveValue(""));
    expect(screen.getByRole("status")).toHaveTextContent("Guest added.");
  });
});

describe("RemovePlayerButton", () => {
  it("explains an unlabeled icon and uses a Relay confirmation dialog", () => {
    render(
      <RemovePlayerButton
        sessionId="59c6fa3f-3f6f-45f2-bbea-b85bc90aa3a7"
        playerId="69c6fa3f-3f6f-45f2-bbea-b85bc90aa3a8"
        name="Mika"
      />,
    );
    const remove = screen.getByRole("button", { name: "Remove Mika" });
    expect(screen.getByRole("tooltip")).toHaveTextContent("Remove Mika");
    fireEvent.click(remove);
    expect(screen.getByRole("dialog")).toHaveAttribute("open");
    expect(screen.getByText(/lose their spot and payment assignment/i)).toBeVisible();
    fireEvent.click(screen.getByRole("button", { name: "Cancel" }));
    expect(screen.getByRole("dialog", { hidden: true })).not.toHaveAttribute("open");
  });
});

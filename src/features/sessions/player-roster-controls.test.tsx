import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";

vi.mock("./actions", () => ({
  addGuestPlayerAction: vi.fn(async () => ({})), approvePlayerAction: vi.fn(async () => ({})), removePlayerAction: vi.fn(async () => ({})), toggleRosterLockAction: vi.fn(async () => ({})),
}));

import { RemovePlayerButton } from "./player-roster-controls";

beforeAll(() => {
  HTMLDialogElement.prototype.showModal = function showModal() { this.setAttribute("open", ""); };
  HTMLDialogElement.prototype.close = function close() { this.removeAttribute("open"); };
});
afterEach(cleanup);

describe("RemovePlayerButton", () => {
  it("explains an unlabeled icon and uses a Relay confirmation dialog", () => {
    render(<RemovePlayerButton sessionId="59c6fa3f-3f6f-45f2-bbea-b85bc90aa3a7" playerId="69c6fa3f-3f6f-45f2-bbea-b85bc90aa3a8" name="Mika" />);
    const remove = screen.getByRole("button", { name: "Remove Mika" });
    expect(screen.getByRole("tooltip")).toHaveTextContent("Remove Mika");
    fireEvent.click(remove);
    expect(screen.getByRole("dialog")).toHaveAttribute("open");
    expect(screen.getByText(/lose their spot and payment assignment/i)).toBeVisible();
    fireEvent.click(screen.getByRole("button", { name: "Cancel" }));
    expect(screen.getByRole("dialog", { hidden: true })).not.toHaveAttribute("open");
  });
});

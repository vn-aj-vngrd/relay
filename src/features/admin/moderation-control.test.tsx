import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("./actions", () => ({
  suspendUserAction: vi.fn(async () => ({})),
  restoreUserAction: vi.fn(async () => ({})),
  cancelSessionAction: vi.fn(async () => ({})),
}));

import { ModerationControl } from "./moderation-control";

beforeEach(() => {
  HTMLDialogElement.prototype.showModal = function showModal() {
    this.setAttribute("open", "");
  };
  HTMLDialogElement.prototype.close = function close() {
    this.removeAttribute("open");
  };
});
afterEach(cleanup);

describe("ModerationControl", () => {
  it("explains suspension and requires an audit reason", () => {
    render(<ModerationControl mode="suspend-user" targetId="59c6fa3f-3f6f-45f2-bbea-b85bc90aa3a7" />);
    fireEvent.click(screen.getByRole("button", { name: "Suspend account" }));
    expect(screen.getByRole("dialog")).toHaveAttribute("open");
    expect(screen.getByText(/signed out and unable/)).toBeInTheDocument();
    expect(screen.getByLabelText("Reason")).toBeRequired();
  });

  it("uses reversible language when restoring access", () => {
    render(<ModerationControl mode="restore-user" targetId="59c6fa3f-3f6f-45f2-bbea-b85bc90aa3a7" />);
    fireEvent.click(screen.getByRole("button", { name: "Restore account" }));
    expect(screen.getByText(/existing games and history stay intact/)).toBeInTheDocument();
  });
});

import { fireEvent, render, screen } from "@testing-library/react";
import { beforeAll, describe, expect, it, vi } from "vitest";
import { LiveCourt } from "./live-court";

vi.mock("./actions", () => ({
  changeScore: vi.fn(),
  finishMatch: vi.fn(),
}));

beforeAll(() => {
  HTMLDialogElement.prototype.showModal = function showModal() { this.setAttribute("open", ""); };
  HTMLDialogElement.prototype.close = function close() { this.removeAttribute("open"); };
});

const props = {
  sessionId: "00000000-0000-4000-8000-000000000001",
  matchId: "00000000-0000-4000-8000-000000000002",
  number: "Court 2",
  teams: ["Van Rivera + Mika Reyes", "AJ Santos + Bea Cruz"] as [string, string],
  scores: [8, 6] as [number, number],
  version: 1,
};

describe("LiveCourt", () => {
  it("keeps team members readable and exposes host scoring controls", () => {
    render(<LiveCourt {...props} canScore />);

    expect(screen.getAllByText("Van Rivera")[0]).toBeVisible();
    expect(screen.getAllByText("Mika Reyes")[0]).toBeVisible();
    expect(screen.getByRole("button", { name: "Add a point to Van Rivera + Mika Reyes" })).toBeEnabled();
    expect(screen.getByRole("button", { name: "Finish match" })).toBeEnabled();
  });

  it("opens a focused scoreboard for hosts and public viewers", () => {
    render(<LiveCourt {...props} canScore={false} />);

    expect(screen.queryByRole("button", { name: /Add a point/ })).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Expand scoreboard" }));
    const dialog = screen.getByRole("dialog", { name: "Court 2 expanded scoreboard" });
    expect(dialog).toHaveAttribute("open");
    fireEvent.click(screen.getByRole("button", { name: "Close expanded scoreboard" }));
    expect(dialog).not.toHaveAttribute("open");
  });
});

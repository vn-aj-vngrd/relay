import { act, fireEvent, render, screen } from "@testing-library/react";
import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

import { LiveCourt } from "./live-court";

const { saveScore, refresh } = vi.hoisted(() => ({
  saveScore: vi.fn(async (input: { teamAScore: number; teamBScore: number; version: number }) => ({
    teamAScore: input.teamAScore,
    teamBScore: input.teamBScore,
    version: input.version + 1,
  })),
  refresh: vi.fn(),
}));

vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh }) }));
vi.mock("./actions", () => ({ saveScore, finishMatch: vi.fn() }));

beforeAll(() => {
  HTMLDialogElement.prototype.showModal = function showModal() {
    this.setAttribute("open", "");
  };
  HTMLDialogElement.prototype.close = function close() {
    this.removeAttribute("open");
  };
});

beforeEach(() => {
  saveScore.mockClear();
  refresh.mockClear();
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
  it("keeps team members readable and exposes scoring controls", () => {
    render(<LiveCourt {...props} canScore />);

    expect(screen.getAllByText("Van Rivera")[0]).toBeVisible();
    expect(screen.getAllByText("Mika Reyes")[0]).toBeVisible();
    expect(screen.getByRole("button", { name: "Add a point to Van Rivera + Mika Reyes" })).toBeEnabled();
    expect(screen.getByRole("button", { name: "Finish match" })).toBeEnabled();
  });

  it("updates immediately and debounces rapid score changes into one durable write", async () => {
    vi.useFakeTimers();
    render(<LiveCourt {...props} canScore />);
    const add = screen.getByRole("button", { name: "Add a point to Van Rivera + Mika Reyes" });

    fireEvent.click(add);
    fireEvent.click(add);
    expect(screen.getAllByLabelText("Van Rivera + Mika Reyes score 10")[0]).toHaveTextContent("10");
    expect(saveScore).not.toHaveBeenCalled();

    await act(async () => vi.advanceTimersByTime(421));
    expect(saveScore).toHaveBeenCalledTimes(1);
    expect(saveScore).toHaveBeenCalledWith(expect.objectContaining({ teamAScore: 10, teamBScore: 6, version: 1 }));
    vi.useRealTimers();
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

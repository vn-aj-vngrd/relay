import { act, fireEvent, render, screen, within } from "@testing-library/react";
import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

import { LiveCourt, LiveCourtDeck } from "./live-court";

const { saveScore, refresh } = vi.hoisted(() => ({
  saveScore: vi.fn(
    async (input: {
      teamAScore: number;
      teamBScore: number;
      version: number;
    }) => ({
      teamAScore: input.teamAScore,
      teamBScore: input.teamBScore,
      version: input.version + 1,
    })
  ),
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
  localStorage.clear();
});

const props = {
  sessionId: "00000000-0000-4000-8000-000000000001",
  matchId: "00000000-0000-4000-8000-000000000002",
  number: "Court 2",
  teams: ["Van Rivera + Mika Reyes", "AJ Santos + Bea Cruz"] as [
    string,
    string,
  ],
  scores: [8, 6] as [number, number],
  version: 1,
};

describe("LiveCourt", () => {
  it("keeps team members readable and exposes scoring controls", () => {
    render(<LiveCourt {...props} canScore />);

    expect(screen.getAllByText("Van Rivera")[0]).toBeVisible();
    expect(screen.getAllByText("Mika Reyes")[0]).toBeVisible();
    expect(
      screen.getByRole("button", {
        name: "Add a point to Van Rivera + Mika Reyes",
      })
    ).toBeEnabled();
    expect(screen.getByRole("button", { name: "Finish match" })).toBeEnabled();
  });

  it("confirms the final teams and score before advancing the rotation", () => {
    render(<LiveCourt {...props} canScore />);

    fireEvent.click(screen.getByRole("button", { name: "Finish match" }));

    expect(
      screen.getByRole("dialog", { name: "Finish Court 2 at 8–6?" })
    ).toHaveAttribute("open");
    expect(
      within(
        screen.getByRole("dialog", { name: "Finish Court 2 at 8–6?" })
      ).getByText(/Van Rivera/)
    ).toBeVisible();
  });

  it("updates immediately and debounces rapid score changes into one durable write", async () => {
    vi.useFakeTimers();
    render(<LiveCourt {...props} canScore />);
    const add = screen.getByRole("button", {
      name: "Add a point to Van Rivera + Mika Reyes",
    });

    fireEvent.click(add);
    fireEvent.click(add);
    expect(
      screen.getAllByLabelText("Van Rivera + Mika Reyes score 10")[0]
    ).toHaveTextContent("10");
    expect(saveScore).not.toHaveBeenCalled();

    await act(async () => vi.advanceTimersByTime(421));
    expect(saveScore).toHaveBeenCalledTimes(1);
    expect(saveScore).toHaveBeenCalledWith(
      expect.objectContaining({ teamAScore: 10, teamBScore: 6, version: 1 })
    );
    vi.useRealTimers();
  });

  it("flushes and journals a pending score when the court unmounts", async () => {
    vi.useFakeTimers();
    const view = render(<LiveCourt {...props} canScore />);
    fireEvent.click(
      screen.getByRole("button", {
        name: "Add a point to Van Rivera + Mika Reyes",
      })
    );

    expect(
      localStorage.getItem(
        "relay-pending-score:00000000-0000-4000-8000-000000000001:00000000-0000-4000-8000-000000000002"
      )
    ).toContain('"scores":[9,6]');
    view.unmount();
    await act(async () => Promise.resolve());

    expect(saveScore).toHaveBeenCalledWith(
      expect.objectContaining({ teamAScore: 9, teamBScore: 6, version: 1 })
    );
    vi.useRealTimers();
  });

  it("recovers a journaled score after the scorer returns", async () => {
    localStorage.setItem(
      "relay-pending-score:00000000-0000-4000-8000-000000000001:00000000-0000-4000-8000-000000000002",
      JSON.stringify({ scores: [10, 7], version: 1 })
    );

    render(<LiveCourt {...props} canScore />);
    await act(async () => Promise.resolve());

    expect(saveScore).toHaveBeenCalledWith(
      expect.objectContaining({ teamAScore: 10, teamBScore: 7, version: 1 })
    );
  });

  it("shows the authoritative score and a retry path after a concurrent update", async () => {
    vi.useFakeTimers();
    saveScore.mockResolvedValueOnce({
      teamAScore: 9,
      teamBScore: 7,
      version: 2,
      conflict: true,
    } as never);
    render(<LiveCourt {...props} canScore />);

    fireEvent.click(
      screen.getByRole("button", {
        name: "Add a point to Van Rivera + Mika Reyes",
      })
    );
    await act(async () => vi.advanceTimersByTime(421));

    expect(
      screen.getAllByLabelText("Van Rivera + Mika Reyes score 9")[0]
    ).toHaveTextContent("9");
    expect(screen.getAllByRole("alert")[0]).toHaveTextContent(
      "Latest score is 9–7. Your 9–6 change wasn’t saved; use the score controls to retry."
    );
    expect(refresh).toHaveBeenCalledOnce();
    vi.useRealTimers();
  });

  it("uses a visible full-screen label without a redundant tooltip", () => {
    render(<LiveCourt {...props} canScore={false} />);
    expect(
      screen.getByRole("button", { name: "Open full-screen scoreboard" })
    ).toHaveTextContent("Full screen");
    expect(
      screen.queryByRole("tooltip", { hidden: true })
    ).not.toBeInTheDocument();
  });

  it("opens a focused scoreboard for hosts and public viewers", () => {
    render(<LiveCourt {...props} canScore={false} />);

    expect(
      screen.queryByRole("button", { name: /Add a point/ })
    ).not.toBeInTheDocument();
    fireEvent.click(
      screen.getByRole("button", { name: "Open full-screen scoreboard" })
    );
    const dialog = screen.getByRole("dialog", {
      name: "Court 2 full-screen scoreboard",
    });
    expect(dialog).toHaveAttribute("open");
    fireEvent.click(
      screen.getByRole("button", { name: "Close expanded scoreboard" })
    );
    expect(dialog).not.toHaveAttribute("open");
  });

  it("switches between live courts and keeps realtime score updates in the full-screen scoreboard", () => {
    const secondCourt = {
      ...props,
      matchId: "00000000-0000-4000-8000-000000000003",
      number: "Court 3",
      teams: ["Lia + Sam", "Noah + Kai"] as [string, string],
      scores: [4, 7] as [number, number],
      canScore: true,
    };
    const { rerender } = render(
      <LiveCourtDeck courts={[{ ...props, canScore: true }, secondCourt]} />
    );

    fireEvent.click(
      screen.getAllByRole("button", { name: "Open full-screen scoreboard" })[0]
    );
    expect(
      screen.getByRole("dialog", { name: "Court 2 full-screen scoreboard" })
    ).toHaveAttribute("open");
    fireEvent.click(
      screen.getByRole("button", { name: "Next court, Court 3" })
    );
    expect(
      screen.getByRole("dialog", { name: "Court 3 full-screen scoreboard" })
    ).toHaveAttribute("open");
    expect(screen.getByText("Court 2 of 2")).toBeVisible();

    rerender(
      <LiveCourtDeck
        courts={[
          { ...props, canScore: true },
          { ...secondCourt, scores: [5, 7], version: 2 },
        ]}
      />
    );
    expect(
      screen.getByRole("dialog", { name: "Court 3 full-screen scoreboard" })
    ).toHaveAttribute("open");
    expect(screen.getAllByLabelText("Lia + Sam score 5")[0]).toHaveTextContent(
      "5"
    );
  });
});

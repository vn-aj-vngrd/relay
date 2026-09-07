import { act, fireEvent, render, screen } from "@testing-library/react";
import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

import { LiveCourt } from "@/features/matches/live-court";
import { PlayRosterSurface } from "./play-roster-surface";
import { RemovePlayerButton } from "./player-roster-controls";

const mocks = vi.hoisted(() => ({
  refresh: vi.fn(),
  saveScore: vi.fn(
    async (input: {
      teamAScore: number;
      teamBScore: number;
      version: number;
    }) => ({ ...input, version: input.version + 1 })
  ),
}));
vi.mock("next/navigation", () => ({
  useSearchParams: () => new URLSearchParams(window.location.search),
  useRouter: () => ({ refresh: mocks.refresh }),
}));
vi.mock("@/features/matches/actions", () => ({
  saveScore: mocks.saveScore,
  finishMatch: vi.fn(),
}));

vi.mock("./actions", () => ({ removePlayerAction: vi.fn(async () => ({})) }));

beforeAll(() => {
  HTMLDialogElement.prototype.showModal = function showModal() {
    this.setAttribute("open", "");
  };
  HTMLDialogElement.prototype.close = function close() {
    this.removeAttribute("open");
  };
});
beforeEach(() => {
  vi.clearAllMocks();
  window.history.replaceState(null, "", "/games/1/play?from=home#court-2");
});
function Roster({ status = "live" }: { status?: string }) {
  return (
    <PlayRosterSurface status={status} count={4} pendingCount={2}>
      <label>
        Guest name
        <input defaultValue="Late player" />
      </label>
    </PlayRosterSurface>
  );
}

describe("Play roster surface", () => {
  it("opens and closes through URL intent without stripping unrelated state or resetting roster input", () => {
    const { rerender } = render(<Roster />);
    fireEvent.click(screen.getByRole("button", { name: "Players (4)" }));
    expect(window.location.search).toBe("?from=home&panel=players");
    // Next's native-history integration rerenders useSearchParams subscribers.
    rerender(<Roster />);
    expect(screen.getByRole("dialog", { name: "Players (4)" })).toBeVisible();
    expect(screen.getByText("2 join requests")).toBeVisible();
    fireEvent.change(screen.getByRole("textbox"), {
      target: { value: "Kept input" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Close players" }));
    rerender(<Roster />);
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(window.location.search).toBe("?from=home");
    expect(window.location.hash).toBe("#court-2");
    expect(screen.getByRole("button", { name: "Players (4)" })).toHaveFocus();
    fireEvent.click(screen.getByRole("button", { name: "Players (4)" }));
    rerender(<Roster />);
    expect(screen.getByRole("textbox")).toHaveValue("Kept input");
    fireEvent(
      screen.getByRole("dialog"),
      new Event("cancel", { bubbles: true, cancelable: true })
    );
    rerender(<Roster />);
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(mocks.refresh).not.toHaveBeenCalled();
  });

  it("leaves nested removal cancellation to the native dialog without closing Players", () => {
    window.history.replaceState(null, "", "/games/1/play?panel=players");
    function NestedRoster() {
      return (
        <PlayRosterSurface status="live" count={4}>
          <RemovePlayerButton
            sessionId="session-1"
            playerId="player-1"
            name="Mika"
          />
        </PlayRosterSurface>
      );
    }
    const { rerender } = render(<NestedRoster />);
    fireEvent.click(screen.getByRole("button", { name: "Remove Mika" }));
    const confirmation = screen.getByRole("dialog", { name: "Remove Mika?" });
    const cancel = new Event("cancel", { cancelable: true });
    fireEvent(confirmation, cancel);
    expect(cancel.defaultPrevented).toBe(false);
    expect(window.location.search).toBe("?panel=players");
    // jsdom has no native Escape default action; browser coverage checks dismissal/focus.
    act(() => (confirmation as HTMLDialogElement).close());
    const roster = screen.getByRole("dialog", { name: "Players (4)" });
    expect(roster).toBeVisible();
    fireEvent(roster, new Event("cancel", { cancelable: true }));
    rerender(<NestedRoster />);
    expect(window.location.search).toBe("");
    expect(screen.getByRole("button", { name: "Players (4)" })).toHaveFocus();
  });

  it("restores URL-owned intent on refresh and history navigation", () => {
    window.history.replaceState(null, "", "/games/1/play?panel=players");
    const { rerender } = render(<Roster />);
    expect(screen.getByRole("dialog")).toBeVisible();
    window.history.replaceState(null, "", "/games/1/play");
    rerender(<Roster />);
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    window.history.replaceState(null, "", "/games/1/play?panel=players");
    rerender(<Roster />);
    expect(screen.getByRole("dialog")).toBeVisible();
  });

  it("focuses the inline roster before play and exposes final roster after lifecycle transitions", () => {
    window.history.replaceState(null, "", "/games/1/play?panel=players");
    const { rerender } = render(<Roster status="published" />);
    expect(screen.getByRole("heading", { name: "Players" })).toHaveFocus();
    expect(screen.getByRole("textbox")).toBeVisible();
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    rerender(<Roster status="live" />);
    expect(screen.getByRole("dialog")).toBeVisible();
    rerender(<Roster status="completed" />);
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Final roster" })).toHaveFocus();
    expect(screen.getByRole("button", { name: "Hide roster" })).toHaveAttribute(
      "aria-expanded",
      "true"
    );
  });

  it.each(["completed", "cancelled"])(
    "keeps %s roster collapsed unless requested",
    (status) => {
      const { rerender } = render(<Roster status={status} />);
      expect(screen.queryByRole("textbox")).not.toBeInTheDocument();
      fireEvent.click(screen.getByRole("button", { name: "Show roster" }));
      rerender(<Roster status={status} />);
      expect(screen.getByRole("textbox")).toBeVisible();
    }
  );

  it("keeps a real scoreboard and its pending debounced write intact across roster toggles", async () => {
    vi.useFakeTimers();
    try {
      function Workspace() {
        return (
          <>
            <Roster />
            <LiveCourt
              sessionId="session-1"
              matchId="match-1"
              number="Court 1"
              teams={["Van + AJ", "Mika + Bea"]}
              scores={[8, 6]}
              version={1}
              canScore
            />
          </>
        );
      }
      const { rerender } = render(<Workspace />);
      const scoreButton = screen.getByRole("button", {
        name: "Add a point to Van + AJ",
      });
      fireEvent.click(scoreButton);
      fireEvent.click(screen.getByRole("button", { name: "Players (4)" }));
      rerender(<Workspace />);
      fireEvent.click(screen.getByRole("button", { name: "Close players" }));
      rerender(<Workspace />);
      expect(
        screen.getByRole("button", { name: "Add a point to Van + AJ" })
      ).toBe(scoreButton);
      expect(screen.getAllByLabelText("Van + AJ score 9")[0]).toBeVisible();
      await act(async () => {
        vi.advanceTimersByTime(1000);
      });
      expect(mocks.saveScore).toHaveBeenCalledTimes(1);
      expect(mocks.saveScore).toHaveBeenCalledWith(
        expect.objectContaining({ teamAScore: 9, teamBScore: 6, version: 1 })
      );
    } finally {
      vi.useRealTimers();
    }
  });
});

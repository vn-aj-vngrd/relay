import { act, cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { GameCollection, type GameCollectionItem, GameViewMenu } from "./game-collection";

const game: GameCollectionItem = {
  id: "game-1",
  href: "/games/game-1",
  title: "Saturday Night Pickle",
  date: "AUG 22",
  dateKey: "2026-08-22",
  endsAt: "2099-08-22T13:00:00.000Z",
  time: "7:00–9:00 PM",
  venue: "Central Pickle",
  playerCount: 8,
  capacity: 10,
  status: "published",
  accentColor: "coral",
  readiness: { ready: false, percent: 67, completed: 2, total: 3, missing: ["booking"] },
};

const liveGame: GameCollectionItem = {
  ...game,
  id: "game-live",
  href: "/games/game-live",
  title: "Wednesday Night Live",
  date: "AUG 20",
  dateKey: "2026-08-20",
  status: "live",
  readiness: undefined,
};

const pastGame: GameCollectionItem = {
  ...game,
  id: "game-2",
  href: "/games/game-2",
  title: "Friday Crew",
  date: "AUG 15",
  dateKey: "2026-08-15",
  endsAt: "2026-08-15T13:00:00.000Z",
  status: "completed",
  readiness: undefined,
};

function page(items: GameCollectionItem[], nextCursor: string | null = null) {
  return { items, nextCursor };
}

let observerCallback: IntersectionObserverCallback;

beforeEach(() => {
  vi.stubGlobal(
    "IntersectionObserver",
    class {
      constructor(callback: IntersectionObserverCallback) {
        observerCallback = callback;
      }
      observe() {}
      disconnect() {}
      unobserve() {}
      takeRecords() {
        return [];
      }
      root = null;
      rootMargin = "0px";
      thresholds = [];
    },
  );
});

afterEach(() => {
  cleanup();
  localStorage.clear();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("GameCollection", () => {
  it("persists the chosen grid or list presentation", () => {
    const { unmount } = render(
      <GameCollection upcomingPage={page([game])} pastPage={page([])} todayKey="2026-08-15" />,
    );
    expect(screen.getByTestId("games-list")).toBeVisible();
    expect(screen.getByRole("link", { name: /Saturday Night Pickle/ }).style.getPropertyValue("--primary")).toContain(
      "#bd4545",
    );
    expect(screen.getByText("67% ready")).toBeVisible();

    fireEvent.click(screen.getByRole("button", { name: "Grid view" }));
    expect(screen.getByTestId("games-grid")).toBeVisible();
    expect(screen.getByTestId("games-grid").querySelector(".grid")).toHaveClass("min-[380px]:grid-cols-2");
    expect(screen.getByRole("link", { name: /Saturday Night Pickle/ })).toHaveClass("p-3.5", "sm:p-5");
    expect(screen.getByText("Game setup")).toBeVisible();
    expect(localStorage.getItem("relay-games-view")).toBe("grid");

    unmount();
    render(<GameCollection upcomingPage={page([game])} pastPage={page([])} todayKey="2026-08-15" />);
    expect(screen.getByTestId("games-grid")).toBeVisible();
  });

  it("keeps mobile view selection behind one compact header control", () => {
    render(
      <>
        <GameViewMenu />
        <GameCollection upcomingPage={page([game])} pastPage={page([])} todayKey="2026-08-15" />
      </>,
    );

    fireEvent.click(screen.getByRole("button", { name: "Change game view, currently List" }));
    const gridOption = screen.getByRole("menuitemradio", { name: "Grid" });
    expect(gridOption).toHaveAttribute("aria-checked", "false");

    fireEvent.click(gridOption);
    expect(screen.getByTestId("games-grid")).toBeVisible();
    expect(localStorage.getItem("relay-games-view")).toBe("grid");
    expect(screen.queryByRole("menu", { name: "Game view" })).not.toBeInTheDocument();
  });

  it("defaults to upcoming while keeping all and past filters available", () => {
    render(<GameCollection upcomingPage={page([game])} pastPage={page([pastGame])} todayKey="2026-08-15" />);

    expect(screen.getByRole("button", { name: "Upcoming" })).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByText("Saturday Night Pickle")).toBeVisible();
    expect(screen.queryByText("Friday Crew")).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "All" }));
    expect(screen.getByText("Saturday Night Pickle")).toBeVisible();
    expect(screen.getByText("Friday Crew")).toBeVisible();

    fireEvent.click(screen.getByRole("button", { name: "Past" }));
    expect(screen.queryByText("Saturday Night Pickle")).not.toBeInTheDocument();
    expect(screen.getByText("Friday Crew")).toBeVisible();
    expect(screen.getByText("1 game")).toBeVisible();
  });

  it("pins live games above scheduled games and never shows them in past", () => {
    render(<GameCollection upcomingPage={page([game, liveGame])} pastPage={page([pastGame])} todayKey="2026-08-15" />);

    expect(screen.getAllByRole("heading", { level: 2 }).map((heading) => heading.textContent)).toEqual([
      "Live now",
      "Upcoming",
    ]);
    expect(screen.getByText("Wednesday Night Live")).toBeVisible();

    fireEvent.click(screen.getByRole("button", { name: "Past" }));
    expect(screen.queryByText("Wednesday Night Live")).not.toBeInTheDocument();
    expect(screen.getByText("Friday Crew")).toBeVisible();
  });

  it("loads and deduplicates the next page as its sentinel approaches", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ items: [game, pastGame], nextCursor: null }),
      }),
    );
    render(<GameCollection upcomingPage={page([game], "next-page")} pastPage={page([])} todayKey="2026-08-15" />);

    await act(async () => {
      observerCallback([{ isIntersecting: true } as IntersectionObserverEntry], {} as IntersectionObserver);
    });

    await waitFor(() => expect(screen.getByText("Friday Crew")).toBeVisible());
    expect(screen.getAllByText("Saturday Night Pickle")).toHaveLength(1);
    expect(screen.queryByRole("button", { name: "Load more upcoming games" })).not.toBeInTheDocument();
  });

  it("loads only the selected calendar month", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ upcoming: [game], past: [] }),
      }),
    );
    render(<GameCollection upcomingPage={page([game])} pastPage={page([])} todayKey="2026-08-15" />);
    fireEvent.click(screen.getByRole("button", { name: "Calendar view" }));

    await waitFor(() => expect(screen.getByRole("heading", { name: "August 2026" })).toBeVisible());
    expect(screen.getByLabelText("Saturday, August 22, 1 game")).toHaveTextContent("Saturday Night Pickle");
    expect(fetch).toHaveBeenCalledWith(
      "/api/games?month=2026-08",
      expect.objectContaining({ credentials: "same-origin" }),
    );
    expect(localStorage.getItem("relay-games-view")).toBe("calendar");
  });
});

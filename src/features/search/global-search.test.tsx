import { act, cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { GlobalSearch } from "./global-search";

beforeEach(() => {
  localStorage.clear();
  vi.stubGlobal(
    "IntersectionObserver",
    class {
      observe() {}
      disconnect() {}
    },
  );
  vi.stubGlobal(
    "fetch",
    vi.fn(async () => new Response(JSON.stringify({ items: [], nextCursor: null }), { status: 200 })),
  );
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  vi.useRealTimers();
});

describe("GlobalSearch", () => {
  it("uses recent searches instead of a minimum-character instruction", async () => {
    localStorage.setItem(
      "relay-recent-searches-v1",
      JSON.stringify([{ query: "Central Pickle", filter: "courts", savedAt: 1 }]),
    );
    render(<GlobalSearch />);

    expect(await screen.findByRole("heading", { name: "Recent searches" })).toBeVisible();
    expect(screen.getByText("Central Pickle")).toBeVisible();
    expect(screen.queryByText(/at least two characters/i)).not.toBeInTheDocument();
  });

  it("searches after one debounced keystroke without submitting a form", async () => {
    vi.useFakeTimers();
    render(<GlobalSearch />);
    fireEvent.change(screen.getByLabelText("Search Relay"), { target: { value: "v" } });
    await act(async () => {
      vi.advanceTimersByTime(181);
    });
    await act(async () => {
      await Promise.resolve();
    });

    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining("q=v"),
      expect.objectContaining({ signal: expect.any(AbortSignal) }),
    );
  });

  it("loads another bounded page without replacing current results", async () => {
    vi.mocked(fetch).mockImplementation(async (input) => {
      const cursor = new URL(String(input), "http://localhost").searchParams.get("cursor");
      const item = {
        id: cursor === "0" ? "one" : "two",
        type: "players",
        title: cursor === "0" ? "Van" : "Mika",
        subtitle: "@player",
        href: "/profile/player",
      };
      return new Response(JSON.stringify({ items: [item], nextCursor: cursor === "0" ? 20 : null }), { status: 200 });
    });
    render(<GlobalSearch initialQuery="a" initialFilter="players" />);
    expect(await screen.findByText("Van")).toBeVisible();
    fireEvent.click(screen.getByRole("button", { name: "Load more results" }));
    expect(await screen.findByText("Mika")).toBeVisible();
    expect(screen.getByText("Van")).toBeVisible();
  });

  it("shows a directional empty result state", async () => {
    render(<GlobalSearch initialQuery="unlikely-query" />);
    await waitFor(() => expect(screen.getByRole("heading", { name: "No results for “unlikely-query”" })).toBeVisible());
  });
});

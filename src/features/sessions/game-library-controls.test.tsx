import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
} from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const router = vi.hoisted(() => ({ push: vi.fn() }));
vi.mock("next/navigation", () => ({ useRouter: () => router }));

import { GameLibraryControls } from "./game-library-controls";
import { defaultGameLibraryFilters } from "./game-library-filters";

beforeEach(() => {
  vi.clearAllMocks();
});
afterEach(() => {
  cleanup();
  vi.useRealTimers();
  window.history.replaceState(null, "", "/");
});

describe("Games compact filters", () => {
  it("debounces title/venue/host search without Enter and preserves calendar state", async () => {
    vi.useFakeTimers();
    window.history.replaceState(
      null,
      "",
      "/games?role=host&month=2020-01&date=2020-01-03"
    );
    render(
      <GameLibraryControls
        filters={{ ...defaultGameLibraryFilters, role: "host" }}
      />
    );
    fireEvent.change(screen.getByRole("searchbox"), {
      target: { value: "Mika" },
    });
    expect(router.push).not.toHaveBeenCalled();
    await act(() => vi.advanceTimersByTimeAsync(300));
    const href = router.push.mock.calls[0][0];
    expect(href).toContain("q=Mika");
    expect(href).toContain("role=host");
    expect(href).toContain("month=2020-01");
  });
  it("reconciles back/forward server props without remounting the search input", () => {
    const { rerender } = render(
      <GameLibraryControls
        filters={{ ...defaultGameLibraryFilters, q: "Mika" }}
      />
    );
    const input = screen.getByRole("searchbox");
    input.focus();
    rerender(
      <GameLibraryControls
        filters={{ ...defaultGameLibraryFilters, q: "Central" }}
      />
    );
    expect(input).toHaveValue("Central");
    expect(input).toHaveFocus();
  });
  it("matches the Open games toolbar with search, When and Role only", () => {
    render(
      <GameLibraryControls
        filters={defaultGameLibraryFilters}
        options={{
          venues: [{ value: "Central", label: "Central" }],
          groups: [
            {
              value: "b07a50cf-8ba7-452e-a421-ab264c9b7e6e",
              label: "Friday crew",
            },
          ],
        }}
      />
    );
    expect(screen.getByLabelText("Search your games")).toHaveAttribute(
      "placeholder",
      "Search a game, venue, or host…"
    );
    expect(screen.getByRole("button", { name: "When" })).toBeVisible();
    expect(screen.getByRole("button", { name: "Your role" })).toBeVisible();
    expect(screen.queryByText("More filters")).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Venue" })
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Your response" })
    ).not.toBeInTheDocument();
  });
  it("clears filters from the main row without duplicate selected chips", () => {
    window.history.replaceState(
      null,
      "",
      "/games?when=past&role=host&month=2020-01&cancelled=true"
    );
    render(
      <GameLibraryControls
        filters={{
          ...defaultGameLibraryFilters,
          when: "past",
          role: "host",
          cancelled: "true",
        }}
      />
    );
    expect(
      screen.queryByRole("button", { name: "Remove Host" })
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole("group", { name: "Filter your games" })
    ).toContainElement(screen.getByRole("button", { name: "Clear filters" }));
    fireEvent.click(screen.getByRole("button", { name: "Clear filters" }));
    expect(router.push).toHaveBeenLastCalledWith("/games?month=2020-01", {
      scroll: false,
    });
  });
  it("explains incomplete and reversed inclusive date ranges", () => {
    const { rerender } = render(
      <GameLibraryControls
        filters={{ ...defaultGameLibraryFilters, when: "range" }}
      />
    );
    expect(screen.getByRole("alert")).toHaveTextContent("Choose both");
    rerender(
      <GameLibraryControls
        filters={{
          ...defaultGameLibraryFilters,
          when: "range",
          from: "2026-08-03",
          until: "2026-08-01",
        }}
      />
    );
    expect(screen.getByRole("alert")).toHaveTextContent("on or after");
    expect(screen.getByText(/Both dates included/)).toBeVisible();
  });
});

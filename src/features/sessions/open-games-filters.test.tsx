import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { OpenGamesFilters } from "./open-games-filters";

const replace = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace }),
}));

const defaultFilters = {
  date: "any" as const,
  location: "",
  available: false,
};

afterEach(() => {
  replace.mockReset();
  vi.useRealTimers();
});

describe("OpenGamesFilters", () => {
  it("uses immediate filter chips without an apply button", () => {
    render(<OpenGamesFilters filters={defaultFilters} />);

    expect(
      screen.queryByRole("button", { name: "Apply filters" })
    ).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Date" })).toHaveClass(
      "!rounded-full"
    );
    expect(
      screen.getByRole("button", { name: "Spots available" })
    ).toHaveAttribute("aria-pressed", "false");

    fireEvent.click(screen.getByRole("button", { name: "Date" }));
    const dateOption = screen.getByRole("option", { name: "Next 7 days" });
    expect(dateOption.closest(".focus-scroll-rail")).toHaveClass(
      "sm:overflow-visible"
    );
    fireEvent.click(dateOption);

    expect(replace).toHaveBeenCalledWith("/games/open?date=7d", {
      scroll: false,
    });
  });

  it("debounces location changes and preserves active chips in the URL", () => {
    vi.useFakeTimers();
    render(
      <OpenGamesFilters
        filters={{ date: "today", location: "", available: true }}
      />
    );

    fireEvent.change(
      screen.getByRole("textbox", { name: "Court or location" }),
      {
        target: { value: "Cebu City" },
      }
    );
    expect(replace).not.toHaveBeenCalled();

    act(() => vi.advanceTimersByTime(300));

    expect(replace).toHaveBeenCalledWith(
      "/games/open?location=Cebu+City&date=today&available=1",
      { scroll: false }
    );
  });

  it("toggles available games immediately and exposes clear only when active", () => {
    const { rerender } = render(<OpenGamesFilters filters={defaultFilters} />);

    fireEvent.click(screen.getByRole("button", { name: "Spots available" }));
    expect(replace).toHaveBeenCalledWith("/games/open?available=1", {
      scroll: false,
    });
    expect(
      screen.queryByRole("link", { name: "Clear filters" })
    ).not.toBeInTheDocument();

    rerender(
      <OpenGamesFilters filters={{ ...defaultFilters, available: true }} />
    );
    expect(screen.getByRole("link", { name: "Clear filters" })).toHaveAttribute(
      "href",
      "/games/open"
    );
  });
});

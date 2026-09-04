import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { OpenGamesFilters } from "./open-games-filters";

const replace = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace }),
}));

const defaultFilters = {
  date: "any" as const,
  dateFrom: "",
  dateTo: "",
  time: "any" as const,
  timeFrom: "",
  timeTo: "",
  location: "",
  available: false,
  price: "any" as const,
  minPrice: null,
  maxPrice: null,
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
    expect(dateOption).toBeVisible();
    fireEvent.click(dateOption);

    expect(replace).toHaveBeenCalledWith("/games/open?date=7d", {
      scroll: false,
    });
  });

  it("debounces location changes and preserves active chips in the URL", () => {
    vi.useFakeTimers();
    render(
      <OpenGamesFilters
        filters={{ ...defaultFilters, date: "today", available: true }}
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

  it("applies Free or a paid range from one price chip", async () => {
    const { rerender } = render(<OpenGamesFilters filters={defaultFilters} />);

    const priceTrigger = screen.getByRole("button", { name: "Price" });
    fireEvent.click(priceTrigger);
    await waitFor(() =>
      expect(screen.getByRole("radio", { name: "Any" })).toHaveFocus()
    );
    fireEvent.click(screen.getByRole("radio", { name: "Free" }));
    fireEvent.click(screen.getByRole("button", { name: "Apply price" }));
    expect(replace).toHaveBeenCalledWith("/games/open?price=free", {
      scroll: false,
    });
    expect(priceTrigger).toHaveFocus();

    rerender(
      <OpenGamesFilters filters={{ ...defaultFilters, price: "free" }} />
    );
    fireEvent.click(screen.getByRole("button", { name: "Free" }));
    fireEvent.click(screen.getByRole("radio", { name: "Paid" }));
    const minimumInput = screen.getByRole("spinbutton", { name: /Minimum/ });
    expect(minimumInput).toHaveClass("focus-visible:!outline-none");
    fireEvent.change(minimumInput, {
      target: { value: "150" },
    });
    fireEvent.change(screen.getByRole("spinbutton", { name: /Maximum/ }), {
      target: { value: "500" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Apply price" }));
    expect(replace).toHaveBeenLastCalledWith(
      "/games/open?price=paid&minPrice=150&maxPrice=500",
      { scroll: false }
    );
  });

  it("reveals compact range controls only for custom date and time filters", () => {
    const { rerender } = render(
      <OpenGamesFilters
        filters={{ ...defaultFilters, date: "custom", time: "custom" }}
      />
    );

    expect(screen.getByRole("button", { name: "From date" })).toHaveClass(
      "compact-control",
      "h-9",
      "!w-auto"
    );
    expect(screen.getByRole("button", { name: "Until date" })).toBeVisible();
    expect(screen.getByRole("button", { name: "From time" })).toHaveClass(
      "compact-control",
      "h-9",
      "!w-auto"
    );
    expect(screen.getByRole("button", { name: "Until time" })).toBeVisible();

    rerender(<OpenGamesFilters filters={defaultFilters} />);
    expect(
      screen.queryByRole("button", { name: "From date" })
    ).not.toBeInTheDocument();
  });

  it("keeps location search separate from filter reset", () => {
    render(
      <OpenGamesFilters
        filters={{ ...defaultFilters, location: "Cebu City" }}
      />
    );

    expect(
      screen.getByRole("button", { name: "Clear location search" })
    ).toBeVisible();
    expect(
      screen.queryByRole("link", { name: "Clear filters" })
    ).not.toBeInTheDocument();
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
      <OpenGamesFilters
        filters={{
          ...defaultFilters,
          location: "Cebu City",
          available: true,
        }}
      />
    );
    expect(screen.getByRole("link", { name: "Clear filters" })).toHaveAttribute(
      "href",
      "/games/open?location=Cebu+City"
    );
  });
});

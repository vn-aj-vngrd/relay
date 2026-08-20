import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { VenueCombobox } from "./venue-combobox";

beforeEach(() => vi.useFakeTimers());
afterEach(() => {
  cleanup();
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

describe("VenueCombobox", () => {
  it("does not search or open suggestions for an existing venue until the user edits it", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          suggestions: [
            {
              id: "venue-1",
              name: "Central Pickle",
              address: "Greenfield District, Mandaluyong, Philippines",
              latitude: 14.5794,
              longitude: 121.0359,
            },
          ],
        }),
        { status: 200, headers: { "Content-Type": "application/json" } },
      ),
    );
    vi.stubGlobal("fetch", fetchMock);

    render(
      <>
        <label htmlFor="venue">Court</label>
        <VenueCombobox defaultValue="Central Pickle" />
      </>,
    );
    await act(() => vi.advanceTimersByTimeAsync(300));

    expect(fetchMock).not.toHaveBeenCalled();
    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
  });

  it("debounces Philippine court suggestions and saves the selected address", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          suggestions: [
            {
              id: "venue-1",
              name: "Central Pickle",
              address: "Greenfield District, Mandaluyong, Philippines",
              latitude: 14.5794,
              longitude: 121.0359,
            },
          ],
        }),
        { status: 200, headers: { "Content-Type": "application/json" } },
      ),
    );
    vi.stubGlobal("fetch", fetchMock);

    render(
      <>
        <label htmlFor="venue">Court</label>
        <VenueCombobox />
      </>,
    );
    const input = screen.getByRole("combobox", { name: "Court" });
    fireEvent.change(input, { target: { value: "Central" } });
    expect(fetchMock).not.toHaveBeenCalled();

    await act(() => vi.advanceTimersByTimeAsync(300));
    expect(screen.getByRole("option", { name: /Central Pickle/ })).toBeVisible();
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/venues/search?q=Central",
      expect.objectContaining({ signal: expect.any(AbortSignal) }),
    );

    fireEvent.click(screen.getByRole("option", { name: /Central Pickle/ }));
    expect(input).toHaveValue("Central Pickle");
    expect(document.querySelector<HTMLInputElement>('input[name="venueAddress"]')).toHaveValue(
      "Greenfield District, Mandaluyong, Philippines",
    );
    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
  });
});

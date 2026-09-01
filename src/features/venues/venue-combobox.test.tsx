import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { VenueCombobox } from "./venue-combobox";

const courts = [
  { id: "venue-1", name: "Central Pickle", address: "Greenfield District, Mandaluyong" },
  { id: "venue-2", name: "South Court", address: "Talisay City, Cebu" },
];

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe("VenueCombobox", () => {
  it("shows Relay courts immediately without a location provider request", () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    render(
      <>
        <label htmlFor="venue">Court</label>
        <VenueCombobox courts={courts} />
      </>,
    );

    fireEvent.focus(screen.getByRole("combobox", { name: "Court" }));

    expect(screen.getByRole("option", { name: /Central Pickle/ })).toBeVisible();
    expect(screen.getByRole("option", { name: /South Court/ })).toBeVisible();
    expect(fetchMock).not.toHaveBeenCalled();
    expect(screen.queryByRole("link", { name: /Geoapify/ })).not.toBeInTheDocument();
  });

  it("filters local courts immediately and saves the selected address", () => {
    render(
      <>
        <label htmlFor="venue">Court</label>
        <VenueCombobox courts={courts} />
      </>,
    );
    const input = screen.getByRole("combobox", { name: "Court" });
    fireEvent.change(input, { target: { value: "Central" } });

    expect(screen.getByRole("option", { name: /Central Pickle/ })).toBeVisible();
    expect(screen.queryByRole("option", { name: /South Court/ })).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("option", { name: /Central Pickle/ }));
    expect(input).toHaveValue("Central Pickle");
    expect(document.querySelector<HTMLInputElement>('input[name="venueId"]')).toHaveValue("venue-1");
    expect(document.querySelector<HTMLInputElement>('input[name="venueAddress"]')).toHaveValue(
      "Greenfield District, Mandaluyong",
    );
    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
  });

  it("keeps suggestions closed after the player moves to the next field", () => {
    render(
      <>
        <label htmlFor="venue">Court</label>
        <VenueCombobox courts={courts} />
        <button type="button">Next field</button>
      </>,
    );
    const input = screen.getByRole("combobox", { name: "Court" });
    fireEvent.change(input, { target: { value: "Central" } });
    expect(screen.getByRole("listbox")).toBeVisible();

    fireEvent.blur(input, { relatedTarget: screen.getByRole("button", { name: "Next field" }) });

    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
  });

  it("still allows a manually entered court when the directory has no match", () => {
    render(
      <>
        <label htmlFor="venue">Court</label>
        <VenueCombobox courts={courts} />
      </>,
    );
    const input = screen.getByRole("combobox", { name: "Court" });
    fireEvent.change(input, { target: { value: "Private neighborhood court" } });

    expect(input).toHaveValue("Private neighborhood court");
    expect(document.querySelector<HTMLInputElement>('input[name="venueId"]')).toHaveValue("");
    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
    expect(screen.getByText(/You can still use what you typed/)).toBeVisible();
  });
});

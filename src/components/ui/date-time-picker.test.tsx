import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { DatePickerField, TimePickerField } from "./date-time-picker";

describe("date and time pickers", () => {
  it("selects a date through Relay's calendar and submits its ISO value", () => {
    const { container } = render(
      <DatePickerField id="date" label="Date" defaultValue="2030-09-06" />
    );
    fireEvent.click(screen.getByRole("button", { name: "Date" }));
    expect(screen.getByRole("dialog", { name: "Date calendar" })).toBeVisible();
    fireEvent.click(
      screen.getByRole("button", { name: "Saturday, September 7, 2030" })
    );
    expect(container.querySelector('input[name="date"]')).toHaveValue(
      "2030-09-07"
    );
    expect(
      screen.queryByRole("dialog", { name: "Date calendar" })
    ).not.toBeInTheDocument();
  });

  it("disables dates before the creation boundary", () => {
    render(
      <DatePickerField
        id="date"
        label="Date"
        defaultValue="2030-09-06"
        minValue="2030-09-06"
      />
    );
    fireEvent.click(screen.getByRole("button", { name: "Date" }));
    expect(
      screen.getByRole("button", { name: "Thursday, September 5, 2030" })
    ).toBeDisabled();
    expect(
      screen.getByRole("button", { name: "Friday, September 6, 2030" })
    ).toBeEnabled();
  });

  it("selects a quarter-hour time without a browser-native control", () => {
    const { container } = render(
      <TimePickerField id="start" label="Start time" />
    );
    fireEvent.click(screen.getByRole("button", { name: "Start time" }));
    fireEvent.click(screen.getByRole("option", { name: "7:15 PM" }));
    expect(container.querySelector('input[name="start"]')).toHaveValue("19:15");
    expect(
      screen.getByRole("button", { name: "Start time" })
    ).toHaveTextContent("7:15 PM");
  });

  it("offers end times after the start and start times before the end", () => {
    const { unmount } = render(
      <TimePickerField id="end" label="End time" afterValue="20:00" />
    );
    fireEvent.click(screen.getByRole("button", { name: "End time" }));
    expect(
      screen.queryByRole("option", { name: "8:00 PM" })
    ).not.toBeInTheDocument();
    expect(screen.getByRole("option", { name: "8:15 PM" })).toBeVisible();

    unmount();
    render(
      <TimePickerField id="start" label="Start time" beforeValue="20:00" />
    );
    fireEvent.click(screen.getByRole("button", { name: "Start time" }));
    expect(screen.getByRole("option", { name: "7:45 PM" })).toBeVisible();
    expect(
      screen.queryByRole("option", { name: "8:00 PM" })
    ).not.toBeInTheDocument();
  });
});

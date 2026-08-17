import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { DatePickerField, TimePickerField } from "./date-time-picker";

describe("date and time pickers", () => {
  it("selects a date through Relay's calendar and submits its ISO value", () => {
    const { container } = render(<DatePickerField id="date" label="Date" defaultValue="2030-09-06" />);
    fireEvent.click(screen.getByRole("button", { name: "Date" }));
    expect(screen.getByRole("dialog", { name: "Date calendar" })).toBeVisible();
    fireEvent.click(screen.getByRole("button", { name: "Saturday, September 7, 2030" }));
    expect(container.querySelector('input[name="date"]')).toHaveValue("2030-09-07");
    expect(screen.queryByRole("dialog", { name: "Date calendar" })).not.toBeInTheDocument();
  });

  it("selects a quarter-hour time without a browser-native control", () => {
    const { container } = render(<TimePickerField id="start" label="Start time" />);
    fireEvent.click(screen.getByRole("button", { name: "Start time" }));
    fireEvent.click(screen.getByRole("option", { name: "7:15 PM" }));
    expect(container.querySelector('input[name="start"]')).toHaveValue("19:15");
    expect(screen.getByRole("button", { name: "Start time" })).toHaveTextContent("7:15 PM");
  });
});

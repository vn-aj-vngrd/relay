import { fireEvent, render, screen } from "@testing-library/react";
import { useState } from "react";
import { describe, expect, it } from "vitest";

import { TimeComboboxField } from "./date-time-picker";

function TimeField({
  minValue,
  afterValue,
  beforeValue,
}: {
  minValue?: string;
  afterValue?: string;
  beforeValue?: string;
}) {
  const [value, setValue] = useState("");
  return (
    <TimeComboboxField
      id="time"
      label="Time"
      value={value}
      onValueChange={setValue}
      minValue={minValue}
      afterValue={afterValue}
      beforeValue={beforeValue}
    />
  );
}

function submittedTime() {
  return document.querySelector<HTMLInputElement>('input[name="time"]')?.value;
}

describe("TimeComboboxField", () => {
  it.each([
    ["3:47 PM", "15:47", "3:47 PM"],
    ["15:47", "15:47", "3:47 PM"],
    ["12 am", "00:00", "12:00 AM"],
    ["12 pm", "12:00", "12:00 PM"],
    [" 9:05 am ", "09:05", "9:05 AM"],
  ])("accepts %s without requiring a preset", (text, value, label) => {
    render(<TimeField />);
    const input = screen.getByRole("combobox", { name: "Time" });
    fireEvent.change(input, { target: { value: text } });
    expect(submittedTime()).toBe(value);
    fireEvent.blur(input);
    expect(input).toHaveValue(label);
  });

  it("selects a custom minute with Enter and reopens the full preset list", () => {
    render(<TimeField />);
    const input = screen.getByRole("combobox", { name: "Time" });
    fireEvent.change(input, { target: { value: "15:47" } });
    expect(screen.getByRole("option", { name: "3:47 PM" })).toBeVisible();
    fireEvent.keyDown(input, { key: "Enter" });
    expect(input).toHaveValue("3:47 PM");
    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
    fireEvent.click(input);
    expect(screen.getAllByRole("option")).toHaveLength(96);
    expect(screen.getByText("4:00 PM")).toHaveClass("font-normal");
    fireEvent.click(screen.getByRole("option", { name: "4:00 PM" }));
    expect(submittedTime()).toBe("16:00");
    fireEvent.click(input);
    expect(screen.getByText("4:00 PM")).toHaveClass("font-semibold");
    expect(screen.getByText("4:15 PM")).toHaveClass("font-normal");
  });

  it.each(["25:00", "12:60", "0 pm", "13 pm", "noon", "9:"])(
    "does not submit invalid input %s or retain an old time",
    (text) => {
      render(<TimeField />);
      const input = screen.getByRole("combobox", { name: "Time" });
      fireEvent.change(input, { target: { value: "10:00" } });
      fireEvent.blur(input);
      fireEvent.change(input, { target: { value: text } });
      expect(submittedTime()).toBe("");
    }
  );

  it("applies the same inclusive minimum and exclusive range to typed times", () => {
    render(
      <TimeField minValue="15:45" afterValue="15:30" beforeValue="17:00" />
    );
    const input = screen.getByRole("combobox", { name: "Time" });
    for (const value of ["15:30", "15:44", "17:00", "18:00"]) {
      fireEvent.change(input, { target: { value } });
      expect(submittedTime()).toBe("");
    }
    fireEvent.change(input, { target: { value: "15:45" } });
    expect(submittedTime()).toBe("15:45");
    fireEvent.change(input, { target: { value: "16:59" } });
    expect(submittedTime()).toBe("16:59");
    fireEvent.change(input, { target: { value: "" } });
    expect(submittedTime()).toBe("");
  });

  it.each(["15:47", "not a time"])(
    "clears %s and returns focus to the input",
    (text) => {
      render(<TimeField />);
      const input = screen.getByRole("combobox", { name: "Time" });
      expect(
        screen.queryByRole("button", { name: "Clear time" })
      ).not.toBeInTheDocument();
      fireEvent.change(input, { target: { value: text } });
      fireEvent.click(screen.getByRole("button", { name: "Clear time" }));
      expect(input).toHaveValue("");
      expect(input).toHaveFocus();
      expect(submittedTime()).toBe("");
      expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
      expect(
        screen.queryByRole("button", { name: "Clear time" })
      ).not.toBeInTheDocument();
      fireEvent.keyDown(input, { key: "ArrowDown" });
      expect(screen.getAllByRole("option")).toHaveLength(96);
      fireEvent.keyDown(input, { key: "Enter" });
      expect(submittedTime()).toBe("00:00");
    }
  );

  it("updates the visible value when the plan resets the time", () => {
    const props = { id: "time", label: "Time", onValueChange: () => undefined };
    const { rerender } = render(<TimeComboboxField {...props} value="19:07" />);
    expect(screen.getByRole("combobox", { name: "Time" })).toHaveValue(
      "7:07 PM"
    );
    rerender(<TimeComboboxField {...props} value="" />);
    expect(screen.getByRole("combobox", { name: "Time" })).toHaveValue("");
  });
});

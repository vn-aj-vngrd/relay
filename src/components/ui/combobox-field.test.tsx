import { fireEvent, render, screen, within } from "@testing-library/react";
import { useState } from "react";
import { describe, expect, it, vi } from "vitest";

import { ComboboxField } from "./combobox-field";

const options = [
  {
    value: "cebu",
    label: "Court District Cebu",
    description: "Mandaue City, Cebu",
  },
  {
    value: "iloilo",
    label: "PicklePoint Iloilo",
    description: "Mandurriao, Iloilo City",
  },
  {
    value: "manila",
    label: "Manila Pickle Club",
    description: "Makati, Metro Manila",
  },
];

function ControlledCombobox({
  onChange = vi.fn(),
}: {
  onChange?: (value: string) => void;
}) {
  const [value, setValue] = useState("");
  return (
    <ComboboxField
      id="court"
      label="Court"
      options={options}
      value={value}
      onValueChange={(next) => {
        setValue(next);
        onChange(next);
      }}
    />
  );
}

describe("ComboboxField", () => {
  it("narrows options as the player types and selects with the keyboard", () => {
    const onChange = vi.fn();
    render(<ControlledCombobox onChange={onChange} />);
    const input = screen.getByRole("combobox", { name: "Court" });

    fireEvent.focus(input);
    fireEvent.change(input, { target: { value: "iloilo" } });

    const listbox = screen.getByRole("listbox", { name: "Court options" });
    expect(
      within(listbox).getByRole("option", { name: /PicklePoint Iloilo/ })
    ).toBeInTheDocument();
    expect(
      within(listbox).queryByRole("option", { name: /Manila Pickle Club/ })
    ).not.toBeInTheDocument();

    fireEvent.keyDown(input, { key: "Enter" });
    expect(onChange).toHaveBeenLastCalledWith("iloilo");
    expect(input).toHaveValue("PicklePoint Iloilo");
    expect(screen.getByDisplayValue("iloilo")).toHaveAttribute("name", "court");
  });

  it("supports arrow navigation and pointer selection from the full dropdown", () => {
    const onChange = vi.fn();
    render(<ControlledCombobox onChange={onChange} />);
    const input = screen.getByRole("combobox", { name: "Court" });

    fireEvent.focus(input);
    expect(screen.getAllByRole("option")).toHaveLength(3);
    fireEvent.keyDown(input, { key: "ArrowDown" });
    fireEvent.keyDown(input, { key: "ArrowDown" });
    fireEvent.keyDown(input, { key: "Enter" });
    expect(onChange).toHaveBeenLastCalledWith("iloilo");

    fireEvent.focus(input);
    fireEvent.change(input, { target: { value: "Cebu" } });
    fireEvent.click(
      screen.getByRole("option", { name: /Court District Cebu/ })
    );
    expect(onChange).toHaveBeenLastCalledWith("cebu");
  });

  it("shows a useful empty state and restores the selected label on Escape", () => {
    render(<ControlledCombobox />);
    const input = screen.getByRole("combobox", { name: "Court" });

    fireEvent.focus(input);
    fireEvent.change(input, { target: { value: "missing" } });
    expect(screen.getByText("No matching options.")).toBeInTheDocument();
    fireEvent.keyDown(input, { key: "Escape" });

    expect(input).toHaveValue("");
    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
  });
});

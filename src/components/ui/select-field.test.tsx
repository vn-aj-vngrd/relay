import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { SelectField } from "./select-field";

const options = [
  { value: "link", label: "Anyone with the link" },
  { value: "private", label: "Private" },
] as const;

describe("SelectField", () => {
  it("uses an accessible Relay listbox and submits the selected value", () => {
    const { container } = render(
      <SelectField
        id="visibility"
        label="Visibility"
        options={options}
        defaultValue="link"
      />
    );
    fireEvent.click(screen.getByRole("button", { name: "Visibility" }));
    fireEvent.click(screen.getByRole("option", { name: "Private" }));
    expect(container.querySelector('input[name="visibility"]')).toHaveValue(
      "private"
    );
    expect(
      screen.getByRole("button", { name: "Visibility" })
    ).toHaveTextContent("Private");
  });

  it("supports arrows, Home, End, typeahead, and focus restoration", () => {
    render(
      <SelectField
        id="visibility"
        label="Visibility"
        options={options}
        defaultValue="link"
      />
    );
    const trigger = screen.getByRole("button", { name: "Visibility" });
    trigger.focus();

    fireEvent.keyDown(trigger, { key: "ArrowDown" });
    expect(trigger).toHaveAttribute("aria-expanded", "true");
    expect(trigger).toHaveAttribute(
      "aria-activedescendant",
      screen.getByRole("option", { name: "Anyone with the link" }).id
    );

    fireEvent.keyDown(trigger, { key: "End" });
    expect(trigger).toHaveAttribute(
      "aria-activedescendant",
      screen.getByRole("option", { name: "Private" }).id
    );
    fireEvent.keyDown(trigger, { key: "Enter" });
    expect(trigger).toHaveTextContent("Private");
    expect(trigger).toHaveFocus();

    fireEvent.keyDown(trigger, { key: "a" });
    expect(trigger).toHaveAttribute(
      "aria-activedescendant",
      screen.getByRole("option", { name: "Anyone with the link" }).id
    );
    fireEvent.keyDown(trigger, { key: "Escape" });
    expect(trigger).toHaveAttribute("aria-expanded", "false");
    expect(trigger).toHaveFocus();
  });

  it("provides one shared compact density for filter chips", () => {
    render(
      <SelectField
        id="setting"
        label="Setting"
        options={options}
        defaultValue="link"
        density="compact"
        className="!w-auto !rounded-full"
      />
    );

    expect(screen.getByRole("button", { name: "Setting" })).toHaveClass(
      "compact-control",
      "h-9",
      "min-h-9",
      "text-[13px]",
      "!rounded-full"
    );
    expect(screen.getByRole("button", { name: "Setting" })).not.toHaveClass(
      "h-11"
    );
  });
});

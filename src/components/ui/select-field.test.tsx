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
      <SelectField id="visibility" label="Visibility" options={options} defaultValue="link" />,
    );
    fireEvent.click(screen.getByRole("button", { name: "Visibility" }));
    fireEvent.click(screen.getByRole("option", { name: "Private" }));
    expect(container.querySelector('input[name="visibility"]')).toHaveValue("private");
    expect(screen.getByRole("button", { name: "Visibility" })).toHaveTextContent("Private");
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
      />,
    );

    expect(screen.getByRole("button", { name: "Setting" })).toHaveClass(
      "compact-control",
      "h-9",
      "min-h-9",
      "text-[13px]",
      "!rounded-full",
    );
    expect(screen.getByRole("button", { name: "Setting" })).not.toHaveClass("h-11");
  });
});

import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { SelectField } from "./select-field";

const options = [{ value: "link", label: "Anyone with the link" }, { value: "private", label: "Private" }] as const;

describe("SelectField", () => {
  it("uses an accessible Relay listbox and submits the selected value", () => {
    const { container } = render(<SelectField id="visibility" label="Visibility" options={options} defaultValue="link" />);
    fireEvent.click(screen.getByRole("button", { name: "Visibility" }));
    fireEvent.click(screen.getByRole("option", { name: "Private" }));
    expect(container.querySelector('input[name="visibility"]')).toHaveValue("private");
    expect(screen.getByRole("button", { name: "Visibility" })).toHaveTextContent("Private");
  });
});

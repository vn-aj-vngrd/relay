import { fireEvent, render, screen } from "@testing-library/react";
import { expect, it } from "vitest";
import { Switch } from "./switch";

it("exposes on/off semantics and preserves native checkbox form submission", () => {
  const { container } = render(
    <form>
      <label htmlFor="test-enabled">
        <Switch id="test-enabled" name="enabled" defaultChecked />
        Enable Agent
      </label>
    </form>
  );
  const control = screen.getByRole("switch", { name: "Enable Agent" });
  expect(control).toBeChecked();
  expect(new FormData(container.querySelector("form")!).get("enabled")).toBe(
    "on"
  );
  fireEvent.click(control);
  expect(control).not.toBeChecked();
  expect(new FormData(container.querySelector("form")!).has("enabled")).toBe(
    false
  );
});

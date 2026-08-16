import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { PreferenceControls } from "./preference-controls";

afterEach(() => {
  cleanup();
  localStorage.clear();
  document.documentElement.removeAttribute("data-density");
});

describe("PreferenceControls", () => {
  it("offers device-local appearance controls on public session pages", () => {
    render(<PreferenceControls appearanceOnly />);
    expect(screen.getByText("Color theme")).toBeVisible();
    expect(screen.queryByText("Default games view")).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Compact" }));
    expect(localStorage.getItem("relay-density")).toBe("compact");
    expect(document.documentElement.dataset.density).toBe("compact");
  });
});

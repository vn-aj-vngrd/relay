import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { PreferenceControls } from "./preference-controls";

afterEach(() => {
  cleanup();
  localStorage.clear();
  document.documentElement.removeAttribute("data-density");
  document.documentElement.dataset.theme = "light";
});

describe("PreferenceControls", () => {
  it("shows only the selected preference group", () => {
    render(<PreferenceControls section="games" />);

    expect(screen.getByText("Default games view")).toBeVisible();
    expect(screen.queryByText("Color theme")).not.toBeInTheDocument();
  });

  it("offers device-local appearance controls on public session pages", () => {
    render(<PreferenceControls appearanceOnly />);
    expect(screen.getByText("Color theme")).toBeVisible();
    expect(screen.getByRole("button", { name: "Light" })).toBeVisible();
    expect(screen.getByRole("button", { name: "Dark" })).toBeVisible();
    const system = screen.getByRole("button", { name: "System" });
    expect(system).toHaveAttribute("aria-pressed", "true");
    fireEvent.click(screen.getByRole("button", { name: "Dark" }));
    expect(localStorage.getItem("relay-theme")).toBe("dark");
    expect(document.documentElement.dataset.theme).toBe("dark");
    expect(screen.queryByText("Default games view")).not.toBeInTheDocument();
    const compact = screen.getByRole("button", { name: "Compact" });
    expect(compact).toHaveClass("min-h-8", "px-2", "sm:min-h-9");
    fireEvent.click(compact);
    expect(localStorage.getItem("relay-density")).toBe("compact");
    expect(document.documentElement.dataset.density).toBe("compact");
  });
});

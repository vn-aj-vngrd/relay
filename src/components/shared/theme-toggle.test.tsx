import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { ThemeSelector, ThemeToggle } from "./theme-toggle";

afterEach(() => {
  cleanup();
  localStorage.clear();
  document.documentElement.dataset.theme = "light";
});

describe("ThemeToggle", () => {
  it("starts light and persists an explicit dark preference", () => {
    document.documentElement.dataset.theme = "light";
    render(<ThemeToggle />);

    fireEvent.click(screen.getByRole("button", { name: "Use dark mode" }));

    expect(document.documentElement.dataset.theme).toBe("dark");
    expect(localStorage.getItem("relay-theme")).toBe("dark");
    expect(screen.getByRole("button", { name: "Use light mode" })).toBeVisible();
  });

  it("offers persistent light, dark, and system options", () => {
    render(<ThemeSelector />);

    const light = screen.getByRole("button", { name: "Light" });
    const dark = screen.getByRole("button", { name: "Dark" });
    const system = screen.getByRole("button", { name: "System" });

    expect(light).toHaveAttribute("aria-pressed", "false");
    expect(dark).toHaveAttribute("aria-pressed", "false");
    expect(system).toHaveAttribute("aria-pressed", "true");

    fireEvent.click(dark);
    expect(document.documentElement.dataset.theme).toBe("dark");
    expect(localStorage.getItem("relay-theme")).toBe("dark");
    expect(dark).toHaveAttribute("aria-pressed", "true");

    fireEvent.click(system);
    expect(localStorage.getItem("relay-theme")).toBe("system");
    expect(system).toHaveAttribute("aria-pressed", "true");
  });
});

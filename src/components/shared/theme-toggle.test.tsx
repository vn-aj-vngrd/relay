import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { ThemeToggle } from "./theme-toggle";

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
});

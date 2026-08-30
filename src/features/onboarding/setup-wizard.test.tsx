import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("./actions", () => ({
  completeProfileSetup: vi.fn(async () => ({})),
  skipProfileSetup: vi.fn(async () => undefined),
}));

import { SetupWizard } from "./setup-wizard";

afterEach(() => {
  cleanup();
  localStorage.clear();
  document.documentElement.removeAttribute("data-theme");
  document.documentElement.removeAttribute("data-density");
});

const initial = { name: "Van", username: "van-player", city: "", skillLevel: "", dominantHand: "" };

describe("SetupWizard", () => {
  it("keeps setup short and makes playing preferences optional", () => {
    render(<SetupWizard initial={initial} next="/home" />);
    expect(screen.getByRole("heading", { name: "Welcome to Relay" })).toBeVisible();
    expect(screen.getByRole("button", { name: "Skip setup and use my defaults" })).toBeVisible();

    fireEvent.click(screen.getByRole("button", { name: "Continue" }));
    expect(screen.getByRole("heading", { name: "Make Relay yours" })).toBeVisible();
    fireEvent.click(screen.getByRole("radio", { name: /Regular/ }));
    fireEvent.click(screen.getByRole("button", { name: "Dark" }));
    fireEvent.click(screen.getByRole("button", { name: "Compact" }));
    expect(localStorage.getItem("relay-theme")).toBe("dark");
    expect(localStorage.getItem("relay-density")).toBe("compact");
    fireEvent.click(screen.getByRole("button", { name: "Continue" }));

    expect(screen.getByRole("heading", { name: "Ready for a quick tour" })).toBeVisible();
    expect(screen.getByLabelText(/How did you discover Relay/)).toBeVisible();
    expect(screen.getByRole("button", { name: "Save and continue" })).toBeVisible();
  });
});

import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("./actions", () => ({
  completeProfileSetup: vi.fn(async () => ({ success: true })),
  skipProfileSetup: vi.fn(async () => undefined),
}));

import { SetupWizard } from "./setup-wizard";

afterEach(() => {
  cleanup();
  localStorage.clear();
});

const initial = {
  name: "Van",
  username: "van-player",
  imageUrl: undefined,
  city: "",
  skillLevel: "",
  dominantHand: "",
  bio: "",
};

describe("SetupWizard", () => {
  it("sequences identity, optional profile details, confirmation, and completion", async () => {
    render(<SetupWizard initial={initial} next="/games/new" />);

    expect(screen.getByRole("heading", { name: "How should players know you?" })).toBeVisible();
    expect(screen.getByLabelText("Name")).toHaveValue("Van");
    expect(screen.getByLabelText("Username")).toHaveValue("van-player");

    fireEvent.click(screen.getByRole("button", { name: "Continue" }));
    expect(screen.getByRole("heading", { name: "Add more about your game" })).toBeVisible();
    expect(screen.getByLabelText("Profile photo")).not.toBeRequired();
    expect(screen.getByLabelText(/City/)).not.toBeRequired();
    expect(screen.getByLabelText(/Playing experience/)).toBeVisible();
    expect(screen.getByLabelText(/Dominant hand/)).toBeVisible();
    expect(screen.getByLabelText(/About you/)).not.toBeRequired();

    fireEvent.change(screen.getByLabelText(/City/), { target: { value: "Cebu City" } });
    fireEvent.click(screen.getByLabelText(/Playing experience/));
    fireEvent.click(screen.getByRole("option", { name: "Regular" }));
    fireEvent.click(screen.getByLabelText(/Dominant hand/));
    fireEvent.click(screen.getByRole("option", { name: "Right" }));
    fireEvent.change(screen.getByLabelText(/About you/), { target: { value: "Weekend doubles player" } });
    fireEvent.click(screen.getByRole("button", { name: "Review profile" }));

    const confirmation = screen.getByRole("heading", { name: "Confirm your profile" }).closest("section");
    expect(confirmation).not.toBeNull();
    expect(within(confirmation!).getByText("@van-player")).toBeVisible();
    expect(within(confirmation!).getByText("Cebu City")).toBeVisible();
    expect(within(confirmation!).getByText("Regular")).toBeVisible();
    expect(within(confirmation!).getByText("Right")).toBeVisible();
    expect(within(confirmation!).getByText("Weekend doubles player")).toBeVisible();

    fireEvent.click(screen.getByRole("button", { name: "Confirm profile" }));
    await waitFor(() => expect(screen.getByRole("heading", { name: "You’re all set" })).toBeVisible());
    expect(screen.getByRole("link", { name: "Start product tour" })).toHaveAttribute(
      "href",
      "/home?tour=1&next=%2Fgames%2Fnew",
    );
  });

  it("prevents invalid identity details before moving forward", () => {
    render(<SetupWizard initial={{ ...initial, name: "", username: "Bad Name" }} next="/games/new" />);

    fireEvent.click(screen.getByRole("button", { name: "Continue" }));

    expect(
      screen
        .getAllByRole("alert")
        .map((alert) => alert.textContent)
        .join(" "),
    ).toContain("Add the name your friends know you by.");
    expect(screen.getByRole("heading", { name: "How should players know you?" })).toBeVisible();
  });
});

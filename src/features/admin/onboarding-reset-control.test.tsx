import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("./actions", () => ({
  resetUserOnboardingAction: vi.fn(async () => ({})),
}));

import { OnboardingResetControl } from "./onboarding-reset-control";

beforeEach(() => {
  HTMLDialogElement.prototype.showModal = function showModal() {
    this.setAttribute("open", "");
  };
  HTMLDialogElement.prototype.close = function close() {
    this.removeAttribute("open");
  };
});
afterEach(cleanup);

describe("OnboardingResetControl", () => {
  it("confirms that onboarding can restart without deleting user data", () => {
    render(
      <OnboardingResetControl
        targetId="59c6fa3f-3f6f-45f2-bbea-b85bc90aa3a7"
        queued={false}
      />
    );

    fireEvent.click(screen.getByRole("button", { name: "Onboard again" }));

    expect(screen.getByRole("dialog")).toHaveAttribute("open");
    expect(
      screen.getByText(/profile, games, and existing answers stay intact/i)
    ).toBeVisible();
    expect(
      screen.getAllByRole("button", { name: "Onboard again" })
    ).toHaveLength(2);
  });

  it("disables the action when onboarding is already queued", () => {
    render(
      <OnboardingResetControl
        targetId="59c6fa3f-3f6f-45f2-bbea-b85bc90aa3a7"
        queued
      />
    );

    expect(
      screen.getByRole("button", { name: "Onboarding queued" })
    ).toBeDisabled();
  });
});

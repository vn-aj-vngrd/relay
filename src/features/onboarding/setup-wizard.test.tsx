import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("./actions", () => ({
  completeProfileSetup: vi.fn(async () => ({})),
  skipProfileSetup: vi.fn(async () => undefined),
}));

import { SetupWizard } from "./setup-wizard";

afterEach(cleanup);

const initial = { name: "Van", username: "van-player", city: "", skillLevel: "", dominantHand: "" };

describe("SetupWizard", () => {
  it("keeps setup short and makes playing preferences optional", () => {
    render(<SetupWizard initial={initial} />);
    expect(screen.getByRole("heading", { name: "Your player profile" })).toBeVisible();
    expect(screen.getByRole("button", { name: "Skip setup and use my defaults" })).toBeVisible();

    fireEvent.click(screen.getByRole("button", { name: "Continue" }));
    expect(screen.getByRole("heading", { name: "How you play" })).toBeVisible();
    fireEvent.click(screen.getByRole("radio", { name: /Regular/ }));
    fireEvent.click(screen.getByRole("button", { name: "Continue" }));

    expect(screen.getByRole("heading", { name: "You’re ready" })).toBeVisible();
    expect(screen.getByLabelText(/How did you discover Relay/)).toBeVisible();
    expect(screen.getByRole("button", { name: "Save and continue" })).toBeVisible();
  });
});

import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("./actions", () => ({ updateOwnProfileAction: vi.fn(async () => ({})) }));

import { ProfileDetailsForm } from "./profile-details-form";

describe("ProfileDetailsForm", () => {
  it("lets a player update recreational context without presenting a rating", () => {
    const { container } = render(
      <ProfileDetailsForm
        profile={{
          name: "Van",
          bio: "Tuesday night regular",
          city: "Mandaluyong",
          skillLevel: "regular",
          dominantHand: "right",
        }}
      />,
    );
    expect(screen.getByRole("textbox", { name: "Name" })).toHaveValue("Van");
    expect(container.querySelector('input[name="skillLevel"]')).toHaveValue("regular");
    expect(screen.getByText(/never a public rating/i)).toBeVisible();
    expect(screen.getByRole("button", { name: "Save details" })).toBeVisible();
  });
});

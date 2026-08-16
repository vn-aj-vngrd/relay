import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("./actions", () => ({
  createUserAction: vi.fn(async () => ({})),
  updateUserProfileAction: vi.fn(async () => ({})),
}));

import { CreateUserForm } from "./create-user-form";
import { UpdateUserForm } from "./update-user-form";

afterEach(cleanup);

describe("admin user forms", () => {
  it("collects the minimum information for a managed account", () => {
    render(<CreateUserForm />);
    expect(screen.getByLabelText("Email")).toBeRequired();
    expect(screen.getByLabelText("Display name")).toBeRequired();
    expect(screen.getByLabelText("Username")).toHaveAttribute("pattern");
    expect(screen.getByRole("button", { name: "Create account" })).toBeEnabled();
  });

  it("loads an existing recreational profile for editing", () => {
    render(<UpdateUserForm userId="59c6fa3f-3f6f-45f2-bbea-b85bc90aa3a7" profile={{ name: "Mika Santos", username: "mika-santos", city: "Manila", skillLevel: "intermediate", dominantHand: "right" }} />);
    expect(screen.getByLabelText("Display name")).toHaveValue("Mika Santos");
    expect(screen.getByLabelText("Playing experience")).toHaveValue("intermediate");
    expect(screen.getByLabelText("Dominant hand")).toHaveValue("right");
  });
});

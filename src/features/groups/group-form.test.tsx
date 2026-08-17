import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("./actions", () => ({ createGroupAction: vi.fn(async () => ({})) }));

import { CreateGroupForm } from "./group-form";

describe("CreateGroupForm", () => {
  it("can save a completed session crew without turning groups into onboarding", () => {
    render(<CreateGroupForm sourceSessionId="59c6fa3f-3f6f-45f2-bbea-b85bc90aa3a7" defaultName="Saturday Crew" savedPlayerCount={6} />);

    expect(screen.getByLabelText("Group name")).toHaveValue("Saturday Crew");
    expect(screen.getByText(/6 signed-in players will become members/)).toBeVisible();
    expect(screen.getByRole("button", { name: "Create group" })).toBeEnabled();
  });
});

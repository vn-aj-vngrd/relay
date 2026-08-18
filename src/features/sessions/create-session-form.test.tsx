import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("./actions", () => ({
  createSessionAction: vi.fn(async () => ({})),
}));

import { CreateSessionForm } from "./create-session-form";

afterEach(cleanup);

describe("CreateSessionForm", () => {
  it("starts a new game blank instead of guessing the plan", () => {
    render(<CreateSessionForm defaults={{}} />);

    expect(screen.getByLabelText("Game name")).toHaveValue("");
    expect(screen.getByLabelText("Venue")).toHaveValue("");
    expect(screen.getByRole("button", { name: "Date" })).toHaveTextContent("Choose a date");
    expect(screen.getByRole("button", { name: "Start time" })).toHaveTextContent("Choose a time");
    expect(screen.getByRole("button", { name: "End time" })).toHaveTextContent("Choose a time");
    expect(screen.getByRole("spinbutton", { name: "Player limit" })).toHaveValue(null);
    expect(screen.getByRole("spinbutton", { name: "Court quantity" })).toHaveValue(null);
    expect(screen.queryByRole("button", { name: "Save draft" })).not.toBeInTheDocument();
  });

  it("uses accessible quantity controls instead of limiting courts to presets", () => {
    render(<CreateSessionForm defaults={{ date: "2026-08-22", courts: 2 }} />);
    const courts = screen.getByRole("spinbutton", { name: "Court quantity" });

    expect(courts).toHaveValue(2);
    expect(courts.parentElement?.nextElementSibling).toHaveTextContent("1–20 courts. You can label them later.");
    const capacity = screen.getByRole("spinbutton", { name: "Player limit" });
    expect(capacity.parentElement?.nextElementSibling).toHaveTextContent(
      "2–40 players. Extra players join the waitlist.",
    );
    fireEvent.click(screen.getByRole("button", { name: "Increase court quantity" }));
    expect(courts).toHaveValue(3);
    fireEvent.change(courts, { target: { value: "20" } });
    expect(screen.getByRole("button", { name: "Increase court quantity" })).toBeDisabled();
  });

  it("shows who will be invited when starting from a group", () => {
    render(
      <CreateSessionForm
        defaults={{
          date: "2026-08-22",
          groupId: "59c6fa3f-3f6f-45f2-bbea-b85bc90aa3a7",
          groupName: "Tuesday Dink Club",
          inviteeCount: 7,
        }}
      />,
    );
    expect(screen.getByText("For Tuesday Dink Club")).toBeVisible();
    expect(screen.getByText("7 group members will be invited when you publish.")).toBeVisible();
  });

  it("keeps game color optional and exposes an accessible palette", () => {
    render(<CreateSessionForm defaults={{ date: "2026-08-22" }} />);
    expect(screen.queryByRole("radio", { name: "Violet" })).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /More details/ }));
    expect(screen.getByRole("radio", { name: "Violet" })).toBeChecked();
    fireEvent.click(screen.getByRole("radio", { name: "Court blue" }));
    expect(screen.getByRole("radio", { name: "Court blue" })).toBeChecked();
  });
});

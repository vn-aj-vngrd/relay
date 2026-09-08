import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("./actions", () => ({
  createSessionAction: vi.fn(async () => ({})),
}));

import { CreateSessionForm } from "./create-session-form";

beforeEach(() => localStorage.clear());
afterEach(cleanup);

describe("CreateSessionForm", () => {
  const completePlan = {
    title: "Saturday Pickle",
    venue: "Central Pickle",
    date: "2030-08-22",
    start: "19:00",
    end: "21:00",
    capacity: 8,
    courts: 2,
  };
  const now = "2030-08-21T08:00:00.000Z";

  function moveToAccess() {
    fireEvent.click(
      screen.getByRole("button", { name: "Continue to players" })
    );
  }

  function moveToDetails() {
    moveToAccess();
    fireEvent.click(
      screen.getByRole("button", { name: "Continue to details" })
    );
  }

  it("starts a new game blank instead of guessing the plan", () => {
    render(<CreateSessionForm defaults={{}} />);

    expect(screen.getByLabelText("Game name")).toHaveValue("");
    expect(screen.getByLabelText("Game name")).toHaveAttribute(
      "placeholder",
      "Enter a game name"
    );
    expect(screen.getByLabelText("Court")).toHaveValue("");
    expect(screen.getByRole("button", { name: "Date" })).toHaveTextContent(
      "Choose a date"
    );
    expect(screen.getByRole("combobox", { name: "Start time" })).toHaveValue(
      ""
    );
    expect(screen.getByRole("combobox", { name: "End time" })).toHaveValue("");
    expect(screen.getByText("Step 1 of 4")).toBeVisible();
    expect(
      screen.queryByRole("spinbutton", { name: "Player limit" })
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Continue to players" })
    ).toBeVisible();
    expect(
      screen.queryByRole("button", { name: "Save draft" })
    ).not.toBeInTheDocument();
  });

  it("clears a field error as soon as the player corrects that field", () => {
    render(<CreateSessionForm defaults={{}} />);
    fireEvent.click(
      screen.getByRole("button", { name: "Continue to players" })
    );

    const title = screen.getByLabelText("Game name");
    expect(
      screen.getByText("Add a game name with at least 2 characters.")
    ).toBeVisible();
    expect(title).toHaveAttribute("aria-invalid", "true");

    fireEvent.change(title, { target: { value: "Friday Pickle" } });
    expect(
      screen.queryByText("Add a game name with at least 2 characters.")
    ).not.toBeInTheDocument();
    expect(title).toHaveAttribute("aria-invalid", "false");

    fireEvent.change(screen.getByLabelText("Court"), {
      target: { value: "3rd Fitness Lab" },
    });
    expect(screen.queryByText("Add the court name.")).not.toBeInTheDocument();
  });

  it("limits a same-day schedule to future and increasing times", () => {
    render(
      <CreateSessionForm
        defaults={{ date: "2030-09-06" }}
        now="2030-09-06T11:52:00.000Z"
      />
    );

    fireEvent.focus(screen.getByRole("combobox", { name: "Start time" }));
    expect(
      screen.queryByRole("option", { name: "7:45 PM" })
    ).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("option", { name: "8:00 PM" }));

    fireEvent.focus(screen.getByRole("combobox", { name: "End time" }));
    expect(
      screen.queryByRole("option", { name: "8:00 PM" })
    ).not.toBeInTheDocument();
    expect(screen.getByRole("option", { name: "8:15 PM" })).toBeVisible();
  });

  it("keeps typed times when continuing to players", () => {
    render(<CreateSessionForm defaults={completePlan} now={now} />);
    const start = screen.getByRole("combobox", { name: "Start time" });
    const end = screen.getByRole("combobox", { name: "End time" });
    fireEvent.change(start, { target: { value: "7:07 PM" } });
    fireEvent.blur(start);
    fireEvent.change(end, { target: { value: "21:12" } });
    fireEvent.blur(end);
    moveToAccess();
    expect(screen.getByText("Step 2 of 4")).toBeVisible();
    expect(screen.getByDisplayValue("19:07")).toHaveAttribute("name", "start");
    expect(screen.getByDisplayValue("21:12")).toHaveAttribute("name", "end");
  });

  it("defaults missing quantities to two players and one court", () => {
    render(
      <CreateSessionForm
        defaults={{ ...completePlan, capacity: undefined, courts: undefined }}
        now={now}
      />
    );
    moveToAccess();
    const capacity = screen.getByRole("spinbutton", { name: "Player limit" });
    const courts = screen.getByRole("spinbutton", { name: "Court quantity" });
    expect(capacity).toHaveValue(2);
    expect(courts).toHaveValue(1);
    expect(
      screen.getByRole("button", { name: "Decrease player limit" })
    ).toBeDisabled();
    expect(
      screen.getByRole("button", { name: "Decrease court quantity" })
    ).toBeDisabled();
    fireEvent.click(
      screen.getByRole("button", { name: "Continue to details" })
    );
    expect(
      screen.getByRole("heading", { name: "Optional details" })
    ).toBeVisible();
  });

  it("uses accessible quantity controls instead of limiting courts to presets", () => {
    render(<CreateSessionForm defaults={completePlan} now={now} />);
    moveToAccess();
    const courts = screen.getByRole("spinbutton", { name: "Court quantity" });

    expect(courts).toHaveValue(2);
    expect(courts.parentElement?.nextElementSibling).toHaveTextContent(
      "1–20 courts."
    );
    const capacity = screen.getByRole("spinbutton", { name: "Player limit" });
    expect(capacity.parentElement?.nextElementSibling).toHaveTextContent(
      "2–40 players. Extra players join the waitlist."
    );
    fireEvent.click(
      screen.getByRole("button", { name: "Increase court quantity" })
    );
    expect(courts).toHaveValue(3);
    fireEvent.change(courts, { target: { value: "20" } });
    expect(
      screen.getByRole("button", { name: "Increase court quantity" })
    ).toBeDisabled();
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
      />
    );
    expect(screen.getByText("For Tuesday Dink Club")).toBeVisible();
    expect(
      screen.getByText("7 group members will be invited when you publish.")
    ).toBeVisible();
  });

  it("explains replayed defaults and preserves access settings without copying game state", () => {
    render(
      <CreateSessionForm
        defaults={{
          ...completePlan,
          date: undefined,
          sourceSessionId: "59c6fa3f-3f6f-45f2-bbea-b85bc90aa3a7",
          inviteeCount: 3,
          visibility: "public",
          requiresApproval: true,
        }}
        now={now}
      />
    );

    expect(screen.getByText("Previous game ready")).toBeVisible();
    expect(screen.getByText(/choose a new date/i)).toBeVisible();
    expect(screen.getByRole("button", { name: "Date" })).toHaveTextContent(
      "Choose a date"
    );

    expect(
      document.querySelector('input[name="visibility"][value="public"]')
    ).toBeChecked();
    expect(
      document.querySelector('input[name="requiresApproval"]')
    ).toBeChecked();
  });

  it("keeps the player note readable as a multiline field on mobile", () => {
    render(<CreateSessionForm defaults={completePlan} now={now} />);
    moveToDetails();

    expect(
      screen.getByRole("textbox", { name: "Note for players" })
    ).toHaveAttribute("rows", "2");
    expect(
      screen.getByRole("textbox", { name: "Note for players" })
    ).toHaveClass("min-h-20");
    expect(
      screen.getByRole("textbox", { name: "Note for players" })
    ).not.toHaveClass("h-11");
  });

  it("keeps game color optional and exposes an accessible palette", () => {
    render(<CreateSessionForm defaults={completePlan} now={now} />);
    expect(
      screen.queryByRole("radio", { name: "Violet" })
    ).not.toBeInTheDocument();
    moveToDetails();
    expect(screen.getByRole("radio", { name: "Violet" })).toBeChecked();
    fireEvent.click(screen.getByRole("radio", { name: "Court blue" }));
    expect(screen.getByRole("radio", { name: "Court blue" })).toBeChecked();
  });

  it("keeps player notes without offering custom court labels", () => {
    const { container } = render(
      <CreateSessionForm defaults={completePlan} now={now} />
    );
    moveToDetails();

    expect(screen.getByLabelText("Note for players")).toBeVisible();
    expect(screen.queryByLabelText("Court labels")).not.toBeInTheDocument();
    expect(container.querySelector('[name="courtNumbers"]')).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "Review game" }));
    expect(screen.getByText("No optional details added")).toBeVisible();
  });

  it("offers optional booking details before a read-only review", () => {
    render(<CreateSessionForm defaults={completePlan} now={now} />);
    moveToDetails();

    expect(
      screen.getByText(
        /You can add or change everything here later in Settings/
      )
    ).toBeVisible();
    fireEvent.click(
      screen.getByRole("checkbox", { name: /Court is already booked/ })
    );
    fireEvent.change(screen.getByLabelText("Booking reference"), {
      target: { value: "RES-2048" },
    });
    fireEvent.change(screen.getByLabelText("Booking total"), {
      target: { value: "2400" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Review game" }));

    expect(
      screen.getByText("Court booked · Reference RES-2048 · ₱2400")
    ).toBeVisible();
    expect(screen.getByText(/This step is read-only/)).toBeVisible();
    expect(screen.getByLabelText("Booking reference")).not.toBeVisible();
    expect(screen.getAllByRole("button", { name: "Edit" })).toHaveLength(3);
  });

  it("restores an anonymous draft without reviving retired court labels", async () => {
    localStorage.setItem(
      "relay-game-draft-v1",
      JSON.stringify({
        version: 1,
        values: {
          title: "Saturday Pickle",
          venue: "Central Pickle",
          date: "2030-08-22",
          start: "19:00",
          end: "21:00",
          capacity: "8",
          courts: "2",
          courtNumbers: "2, 3, Center",
          visibility: "link",
          costKind: "free",
          cost: "0",
          accentColor: "violet",
        },
      })
    );

    render(<CreateSessionForm defaults={{}} now={now} resumeAnonymousDraft />);

    expect(
      await screen.findByRole("heading", { name: "Review your game" })
    ).toBeVisible();
    expect(screen.getByText("Saturday Pickle · Central Pickle")).toBeVisible();
    expect(screen.getByText("No optional details added")).toBeVisible();
    expect(screen.getByText("Free · No payment needed")).toBeVisible();
    expect(screen.queryByDisplayValue("2, 3, Center")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Publish game" })).toBeVisible();
  });

  it("asks anonymous planners to authenticate only after review", () => {
    render(
      <CreateSessionForm
        defaults={completePlan}
        now={now}
        isAuthenticated={false}
      />
    );
    moveToDetails();
    fireEvent.click(screen.getByRole("button", { name: "Review game" }));

    expect(
      screen.getByRole("button", { name: "Create account and publish" })
    ).toBeVisible();
    expect(screen.getByRole("button", { name: "Log in" })).toBeVisible();
    expect(
      screen.queryByRole("button", { name: "Publish game" })
    ).not.toBeInTheDocument();
    expect(screen.getByText(/draft stays in this browser/i)).toBeVisible();
  });

  it("starts payment unset and lets a public game reach review", () => {
    render(<CreateSessionForm defaults={completePlan} now={now} />);
    moveToAccess();

    expect(screen.queryByText("Player price")).not.toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Payment choice" })
    ).toHaveTextContent("Decide later");

    fireEvent.click(screen.getByRole("radio", { name: /^Public/ }));
    fireEvent.click(
      screen.getByRole("button", { name: "Continue to details" })
    );
    expect(
      screen.getByRole("heading", { name: "Optional details" })
    ).toBeVisible();
    fireEvent.click(screen.getByRole("button", { name: "Review game" }));
    expect(screen.getByText(/Payment not set up yet/)).toBeVisible();
    expect(
      screen.getByText(/Payment not set up yet.*It won’t appear in Open games/)
    ).toBeVisible();
  });
  it("records collection intent without revealing or requiring setup", () => {
    render(<CreateSessionForm defaults={completePlan} now={now} />);
    moveToAccess();
    fireEvent.click(screen.getByRole("button", { name: "Payment choice" }));
    fireEvent.click(screen.getByRole("option", { name: "Collect payment" }));
    expect(screen.queryByLabelText("Expense 1")).not.toBeInTheDocument();
    expect(screen.queryByLabelText("Total amount")).not.toBeInTheDocument();
    expect(screen.queryByLabelText("Payment details")).not.toBeInTheDocument();
    expect(
      screen.getByText(/Set the price and payment instructions/)
    ).toBeVisible();
    fireEvent.click(
      screen.getByRole("button", { name: "Continue to details" })
    );
    fireEvent.click(screen.getByRole("button", { name: "Review game" }));
    expect(
      screen.getByText(/Collect payment · Set the price and instructions/)
    ).toBeVisible();
    fireEvent.click(screen.getAllByRole("button", { name: "Edit" })[1]);
    expect(
      screen.getByRole("button", { name: "Payment choice" })
    ).toHaveTextContent("Collect payment");
  });

  it("restores intent-only drafts at Review without payment fields", async () => {
    localStorage.setItem(
      "relay-game-draft-v1",
      JSON.stringify({
        version: 1,
        values: {
          ...completePlan,
          capacity: "8",
          courts: "2",
          costKind: "collect",
        },
      })
    );
    render(<CreateSessionForm defaults={{}} now={now} resumeAnonymousDraft />);
    expect(
      await screen.findByRole("heading", { name: "Review your game" })
    ).toBeVisible();
    expect(
      screen.getByText(/Collect payment · Set the price and instructions/)
    ).toBeVisible();
    expect(screen.queryByLabelText("Payment details")).not.toBeInTheDocument();
    fireEvent.click(screen.getAllByRole("button", { name: "Edit" })[1]);
    expect(
      screen.getByRole("button", { name: "Payment choice" })
    ).toHaveTextContent("Collect payment");
  });

  it("restores collect setup and its serializable fields after authentication", async () => {
    localStorage.setItem(
      "relay-game-draft-v1",
      JSON.stringify({
        version: 1,
        values: {
          ...completePlan,
          capacity: "8",
          courts: "2",
          costKind: "collect",
          label: "Court",
          total: "2400",
          method: "Maya",
          details: "Host account",
        },
      })
    );
    render(<CreateSessionForm defaults={{}} now={now} resumeAnonymousDraft />);
    expect(
      await screen.findByRole("heading", { name: "Review your game" })
    ).toBeVisible();
    expect(
      screen.getByText(
        /Collect payment · Player share will be calculated when players join/
      )
    ).toBeVisible();
    expect(screen.getByLabelText("Total amount")).toHaveValue(2400);
    expect(screen.getByLabelText("Payment details")).toHaveValue(
      "Host account"
    );
  });
});

import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("./actions", () => ({ updateSessionAction: vi.fn(async () => ({})) }));

import {
  type SessionSettingsDefaults,
  SessionSettingsForm,
} from "./session-settings-form";

const defaults: SessionSettingsDefaults = {
  id: "59c6fa3f-3f6f-45f2-bbea-b85bc90aa3a7",
  version: 2,
  title: "Saturday Night Pickle",
  accentColor: "teal",
  venue: "Central Pickle",
  venueId: "",
  venueAddress: "Quezon City",
  date: "2026-08-22",
  start: "19:00",
  end: "22:00",
  capacity: 10,
  courts: 2,
  courtNumbers: "2, 3",
  cost: "300",
  notes: "Bring water",
  visibility: "link",
  requiresApproval: false,
  booked: false,
  bookingReference: "",
  bookingTotal: "",
  bookingNotes: "",
};

afterEach(cleanup);

describe("SessionSettingsForm", () => {
  it("loads the current shared plan and exposes one save action", () => {
    const { container } = render(<SessionSettingsForm defaults={defaults} />);
    expect(screen.getByLabelText("Game name")).toHaveValue(
      "Saturday Night Pickle"
    );
    expect(screen.getByLabelText("Court")).toHaveValue("Central Pickle");
    expect(screen.getByLabelText("Player limit")).toHaveValue(10);
    expect(container.querySelector('input[name="visibility"]')).toHaveValue(
      "link"
    );
    expect(
      screen.queryByRole("heading", {
        name: "Invite settings",
      })
    ).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Save changes" })).toBeEnabled();
  });

  it("shows invite controls without exposing the other settings sections", () => {
    const { container } = render(
      <SessionSettingsForm defaults={defaults} section="invite" />
    );

    expect(
      screen.getByRole("heading", {
        name: "Invite settings",
      })
    ).toBeVisible();
    expect(
      screen.queryByRole("heading", { name: "Plan" })
    ).not.toBeInTheDocument();
    expect(screen.getByRole("radio", { name: "Teal" })).toBeChecked();
    expect(
      screen.getByText(/Sets the cover, active tabs, and actions/)
    ).toBeVisible();
    expect(screen.getByText("₱300.00 per player")).toBeVisible();
    expect(container.querySelector('input[name="costKind"]')).toHaveValue(
      "unspecified"
    );
    expect(
      screen.queryByRole("spinbutton", { name: /player price/i })
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole("checkbox", { name: /Approve new players/ })
    ).not.toBeChecked();
  });

  it("reveals booking details only when the host confirms a reservation", () => {
    render(<SessionSettingsForm defaults={defaults} section="booking" />);
    expect(
      screen.queryByLabelText("Booking reference")
    ).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("checkbox", { name: /Court is booked/ }));
    expect(screen.getByLabelText("Booking reference")).toBeVisible();
    expect(screen.getByLabelText("Booking total")).toBeVisible();
    expect(screen.getByLabelText("Booking notes")).toHaveAttribute("rows", "2");
  });
});

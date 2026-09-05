import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ push: vi.fn() }));
vi.mock("next/navigation", () => ({ useRouter: () => ({ push: mocks.push }) }));
vi.mock("./court-booking-actions", () => ({
  confirmCourtBooking: vi.fn(async () => ({ success: true })),
}));

import { CourtBookingGate } from "./court-booking-gate";

beforeEach(() => {
  vi.clearAllMocks();
  HTMLDialogElement.prototype.showModal = function showModal() {
    this.setAttribute("open", "");
  };
  HTMLDialogElement.prototype.close = function close() {
    this.removeAttribute("open");
  };
});
afterEach(cleanup);

describe("CourtBookingGate", () => {
  it("opens the wizard directly when booking is already resolved", () => {
    render(
      <CourtBookingGate sessionId="session" version={1} ready>
        <h2>Confirm who’s playing</h2>
      </CourtBookingGate>
    );
    expect(
      screen.getByRole("heading", { name: "Confirm who’s playing" })
    ).toBeVisible();
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });
  it("prompts only about the court and lets the host leave without starting", () => {
    render(
      <CourtBookingGate sessionId="session" version={1} ready={false}>
        <h2>Players</h2>
      </CourtBookingGate>
    );
    expect(
      screen.getByRole("dialog", { name: "Is the court ready?" })
    ).toBeVisible();
    expect(
      screen.getByRole("button", { name: "Booking confirmed" })
    ).toBeVisible();
    expect(
      screen.getByRole("button", { name: "No booking needed" })
    ).toBeVisible();
    expect(
      screen.queryByRole("heading", { name: "Players" })
    ).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Not yet" }));
    expect(mocks.push).toHaveBeenCalledWith("/games/session/play");
  });
  it("preserves wizard selections when booking is changed elsewhere", () => {
    const children = (
      <input aria-label="Saved selection" defaultValue="Paddle Stack" />
    );
    const { rerender } = render(
      <CourtBookingGate sessionId="session" version={1} ready>
        {children}
      </CourtBookingGate>
    );
    fireEvent.change(screen.getByLabelText("Saved selection"), {
      target: { value: "Mix It Up" },
    });
    rerender(
      <CourtBookingGate sessionId="session" version={2} ready={false}>
        {children}
      </CourtBookingGate>
    );
    expect(screen.getByRole("dialog")).toBeVisible();
    rerender(
      <CourtBookingGate sessionId="session" version={3} ready>
        {children}
      </CourtBookingGate>
    );
    expect(screen.getByLabelText("Saved selection")).toHaveValue("Mix It Up");
  });
});

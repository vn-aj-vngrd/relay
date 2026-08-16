import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("./actions", () => ({ rsvpAction: vi.fn(async () => ({})) }));

import { RsvpControl } from "./rsvp-control";

const sessionId = "59c6fa3f-3f6f-45f2-bbea-b85bc90aa3a7";

afterEach(cleanup);

describe("RsvpControl", () => {
  it("offers a new visitor both guest and account join paths", () => {
    render(<RsvpControl sessionId={sessionId} slug="friends-night" />);
    expect(screen.getByRole("textbox", { name: "Your name" })).toBeRequired();
    expect(screen.getByRole("button", { name: "Confirm I’m going" })).toBeEnabled();
    expect(screen.getByRole("link", { name: /Sign in to join/ })).toHaveAttribute("href", "/login?next=%2Fs%2Ffriends-night");
  });

  it("recognizes a returning guest without asking for their name again", () => {
    render(<RsvpControl sessionId={sessionId} slug="friends-night" guestName="Mika Reyes" currentRsvp="going" />);
    expect(screen.queryByRole("textbox", { name: "Your name" })).not.toBeInTheDocument();
    expect(screen.getByText("Mika Reyes")).toBeVisible();
    expect(screen.getByText("Guest player")).toBeVisible();
  });

  it("explains when the host has closed responses", () => {
    render(<RsvpControl sessionId={sessionId} slug="friends-night" locked />);
    expect(screen.getByText("The roster is closed")).toBeVisible();
    expect(screen.queryByRole("button", { name: "Confirm I’m going" })).not.toBeInTheDocument();
  });
});

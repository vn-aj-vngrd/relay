import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ rsvpAction: vi.fn(async () => ({})) }));
vi.mock("./actions", () => ({ rsvpAction: mocks.rsvpAction }));

import { RsvpControl } from "./rsvp-control";

const sessionId = "59c6fa3f-3f6f-45f2-bbea-b85bc90aa3a7";

beforeEach(() => mocks.rsvpAction.mockReset().mockResolvedValue({}));
afterEach(cleanup);

describe("RsvpControl", () => {
  it("keeps guest RSVP primary while leaving existing players a quiet sign-in path", () => {
    render(<RsvpControl sessionId={sessionId} slug="friends-night" />);
    expect(screen.getByRole("textbox", { name: "Your name" })).toBeRequired();
    expect(screen.getByRole("button", { name: "Confirm I’m going" })).toHaveClass("min-h-9", "text-[13px]");
    expect(screen.getByRole("button", { name: "Share game" })).toHaveClass("min-h-9", "text-[13px]");
    expect(screen.getByRole("button", { name: "Going" })).toHaveClass("min-h-9", "text-[13px]");
    expect(screen.getByRole("button", { name: "Playing experience (optional)" })).toBeVisible();
    expect(screen.getByRole("link", { name: "Already use Relay? Sign in" })).toHaveAttribute(
      "href",
      "/login?next=%2Fs%2Ffriends-night",
    );
    expect(screen.queryByRole("link", { name: "Keep this game in Relay" })).not.toBeInTheDocument();
  });

  it("offers account claiming only after a guest response is saved", async () => {
    mocks.rsvpAction.mockResolvedValueOnce({ success: true, rsvp: "going" });
    render(<RsvpControl sessionId={sessionId} slug="friends-night" />);

    fireEvent.change(screen.getByRole("textbox", { name: "Your name" }), { target: { value: "Mika Reyes" } });
    fireEvent.click(screen.getByRole("button", { name: "Confirm I’m going" }));

    expect(await screen.findByRole("heading", { name: "Your spot is saved." })).toBeVisible();
    expect(screen.getByRole("link", { name: "Keep this game in Relay" })).toHaveAttribute(
      "href",
      "/signup?next=%2Fs%2Ffriends-night",
    );
    expect(screen.getByRole("link", { name: "Sign in" })).toHaveAttribute("href", "/login?next=%2Fs%2Ffriends-night");
    await waitFor(() => expect(mocks.rsvpAction).toHaveBeenCalledOnce());
  });

  it("uses the account profile experience without allowing a session override", () => {
    render(
      <RsvpControl
        sessionId={sessionId}
        slug="friends-night"
        signedIn
        accountName="Mika Reyes"
        accountUsername="mika"
        currentSkillLevel="regular"
      />,
    );

    expect(screen.queryByRole("button", { name: "Playing experience (optional)" })).not.toBeInTheDocument();
    expect(screen.getByText("Regular")).toBeVisible();
    expect(screen.getByText("Uses your profile setting")).toBeVisible();
    expect(screen.getByRole("link", { name: "Edit profile" })).toHaveAttribute("href", "/profile/mika/edit");
  });

  it("sets the right expectation when going means joining a waitlist", () => {
    render(<RsvpControl sessionId={sessionId} slug="friends-night" full />);
    expect(screen.getByRole("button", { name: "Join waitlist" })).toBeVisible();
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

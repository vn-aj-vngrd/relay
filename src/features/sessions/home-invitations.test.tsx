import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

type MockActionState = {
  success?: boolean;
  rsvp?: "going" | "maybe" | "pending" | "waitlisted" | "declined";
  error?: string;
};

const mocks = vi.hoisted(() => ({
  rsvpAction: vi.fn(async (_: unknown, formData: FormData): Promise<MockActionState> => ({
    success: true,
    rsvp: formData.get("choice") as MockActionState["rsvp"],
  })),
}));

vi.mock("./actions", () => ({ rsvpAction: mocks.rsvpAction }));

import type { GameCollectionItem } from "./game-collection-types";
import { HomeInvitations } from "./home-invitations";

const invitation: GameCollectionItem = {
  id: "game-invite",
  href: "/games/game-invite",
  title: "Sunday Open Play",
  date: "SEP 6",
  dateKey: "2026-09-06",
  endsAt: "2099-09-06T13:00:00.000Z",
  time: "7:00–9:00 PM",
  venue: "Central Pickle",
  playerCount: 8,
  capacity: 10,
  status: "published",
  accentColor: "coral",
  viewerRsvp: "invited",
  invitedAt: "2026-09-01T00:00:00.000Z",
  hostName: "Mika Reyes",
  estimatedCostCents: 30000,
  requiresApproval: true,
  spotsRemaining: 2,
  canReplay: false,
};

afterEach(() => {
  cleanup();
  mocks.rsvpAction.mockClear();
  mocks.rsvpAction.mockImplementation(async (_: unknown, formData: FormData) => ({
    success: true,
    rsvp: formData.get("choice") as MockActionState["rsvp"],
  }));
});

describe("HomeInvitations", () => {
  it("shows decision context and responds without opening the game", async () => {
    render(<HomeInvitations initialItems={[invitation]} />);

    expect(screen.getByRole("link", { name: "Sunday Open Play" })).toHaveAttribute("href", "/games/game-invite");
    expect(screen.getByText("Hosted by Mika Reyes")).toBeVisible();
    expect(screen.getByText("Central Pickle")).toBeVisible();
    expect(screen.getByText("₱300 estimated")).toBeVisible();
    expect(screen.getByText("2 spots open")).toBeVisible();
    expect(screen.getByText("Going sends a request for the host to approve.")).toBeVisible();

    fireEvent.click(screen.getByRole("button", { name: "Maybe" }));

    await waitFor(() => expect(screen.queryByRole("heading", { name: "Invites" })).not.toBeInTheDocument());
    const submitted = mocks.rsvpAction.mock.calls[0]?.[1] as FormData;
    expect(submitted.get("sessionId")).toBe("game-invite");
    expect(submitted.get("choice")).toBe("maybe");
    expect(submitted.get("inviteSource")).toBe("home");
    expect(screen.getByText("Your response to Sunday Open Play was saved.")).toHaveClass("sr-only");
  });

  it("keeps the invite actionable when saving fails", async () => {
    mocks.rsvpAction.mockResolvedValueOnce({ error: "Your response couldn’t be saved. Try again." });
    render(<HomeInvitations initialItems={[invitation]} />);

    fireEvent.click(screen.getByRole("button", { name: "Going" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("Your response couldn’t be saved. Try again.");
    expect(screen.getByRole("heading", { name: "Invites" })).toBeVisible();
    expect(screen.getByRole("button", { name: "Going" })).toBeEnabled();
  });
});

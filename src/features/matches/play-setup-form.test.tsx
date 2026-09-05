import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("./actions", () => ({ startPlay: vi.fn(async () => ({})) }));

import { PlaySetupForm } from "./play-setup-form";

afterEach(cleanup);

const players = [
  { id: "00000000-0000-4000-8000-000000000001", name: "Van" },
  { id: "00000000-0000-4000-8000-000000000002", name: "AJ" },
  { id: "00000000-0000-4000-8000-000000000003", name: "Mika" },
  { id: "00000000-0000-4000-8000-000000000004", name: "John" },
];

describe("PlaySetupForm", () => {
  it("requires a fresh review after arrivals change", () => {
    const props = {
      sessionId: "session",
      playerCount: 4,
      courtCount: 1,
      players,
      activePlayerIds: players.map((player) => player.id),
      readiness: { ready: true },
    };
    const onReview = vi.fn();
    const { rerender } = render(
      <PlaySetupForm {...props} wizardStep="options" onReview={onReview} />
    );
    fireEvent.click(screen.getByRole("button", { name: "Review setup" }));
    expect(onReview).toHaveBeenCalledOnce();
    rerender(<PlaySetupForm {...props} wizardStep="review" />);
    expect(screen.getByRole("button", { name: "Start Play" })).toBeEnabled();
    rerender(
      <PlaySetupForm
        {...props}
        playerCount={3}
        activePlayerIds={props.activePlayerIds.slice(0, 3)}
        wizardStep="review"
      />
    );
    expect(screen.getByRole("button", { name: "Start Play" })).toBeDisabled();
    expect(screen.getByRole("alert")).toHaveTextContent(
      "Arrivals or courts changed"
    );
  });

  it("blocks incomplete setup and preserves the rotation when arrangements are saved", () => {
    const props = {
      sessionId: "session",
      playerCount: 4,
      courtCount: 1,
      players,
    };
    const { rerender } = render(
      <PlaySetupForm {...props} readiness={{ ready: false }} />
    );
    fireEvent.click(screen.getByRole("radio", { name: /Mix It Up/ }));
    expect(screen.getByRole("button", { name: "Start Play" })).toBeDisabled();
    expect(
      screen.getByRole("link", { name: /Complete the missing setup/ })
    ).toHaveAttribute("href", "#setup-readiness");
    rerender(<PlaySetupForm {...props} readiness={{ ready: true }} />);
    expect(screen.getByRole("radio", { name: /Mix It Up/ })).toBeChecked();
    expect(screen.getByRole("button", { name: "Start Play" })).toBeEnabled();
  });

  it("starts with the flexible Paddle Stack setup and reveals its queue rule", () => {
    const { container } = render(
      <PlaySetupForm
        sessionId="59c6fa3f-3f6f-45f2-bbea-b85bc90aa3a7"
        playerCount={10}
        courtCount={2}
      />
    );
    expect(screen.getByRole("radio", { name: /Paddle Stack/ })).toBeChecked();
    expect(container.querySelector('input[name="queueRule"]')).toHaveValue(
      "adaptive"
    );
    expect(
      screen.queryByRole("button", { name: "Round timer" })
    ).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Start Play" })).toBeVisible();
  });

  it("lets the host keep partners together and edit every pair", () => {
    const { container } = render(
      <PlaySetupForm
        sessionId="59c6fa3f-3f6f-45f2-bbea-b85bc90aa3a7"
        playerCount={4}
        courtCount={1}
        players={players}
      />
    );
    fireEvent.click(
      screen.getByRole("radio", { name: /^Keep pairs together/ })
    );
    expect(
      screen.getByRole("heading", { name: "Set the pairs" })
    ).toBeVisible();
    expect(container.querySelector('input[name="pair-0-a"]')).toHaveValue(
      players[0].id
    );
    expect(container.querySelector('input[name="pair-0-b"]')).toHaveValue(
      players[1].id
    );
    expect(container.querySelector('input[name="pair-1-a"]')).toHaveValue(
      players[2].id
    );
    expect(container.querySelector('input[name="pair-1-b"]')).toHaveValue(
      players[3].id
    );
    fireEvent.click(
      screen.getByRole("button", { name: "Pair 1, first player" })
    );
    fireEvent.click(screen.getByRole("option", { name: "Mika" }));
    expect(container.querySelector('input[name="pair-0-a"]')).toHaveValue(
      players[2].id
    );
    expect(container.querySelector('input[name="pair-1-a"]')).toHaveValue(
      players[0].id
    );
  });

  it("offers Team Round Robin for an even roster and explains odd-roster byes", () => {
    const { rerender } = render(
      <PlaySetupForm
        sessionId="59c6fa3f-3f6f-45f2-bbea-b85bc90aa3a7"
        playerCount={4}
        courtCount={1}
        players={players}
      />
    );
    fireEvent.click(screen.getByRole("radio", { name: /Team Round Robin/ }));
    expect(screen.getByText(/every other pair once/i)).toBeVisible();
    expect(
      screen.getByRole("heading", { name: "Set the pairs" })
    ).toBeVisible();
    rerender(
      <PlaySetupForm
        sessionId="59c6fa3f-3f6f-45f2-bbea-b85bc90aa3a7"
        playerCount={5}
        courtCount={1}
        players={[
          ...players,
          { id: "00000000-0000-4000-8000-000000000005", name: "Chris" },
        ]}
      />
    );
    expect(
      screen.getByRole("radio", { name: /Team Round Robin/ })
    ).toBeDisabled();
    expect(
      screen.getByText("Needs an even going roster of at least 4 players.")
    ).toBeVisible();
  });

  it("pairs the full going roster while late players stay out of the opening rotation", () => {
    const latePlayers = [
      { id: "00000000-0000-4000-8000-000000000005", name: "Chris" },
      { id: "00000000-0000-4000-8000-000000000006", name: "Sam" },
    ];
    render(
      <PlaySetupForm
        sessionId="59c6fa3f-3f6f-45f2-bbea-b85bc90aa3a7"
        playerCount={4}
        courtCount={1}
        players={[...players, ...latePlayers]}
        activePlayerIds={players.map((player) => player.id)}
      />
    );

    fireEvent.click(
      screen.getByRole("radio", { name: /^Keep pairs together/ })
    );

    expect(screen.getByText("4 here · 6 going · 1 court")).toBeVisible();
    expect(screen.getByText("Pair 3")).toBeVisible();
  });

  it("explains and selects Mix It Up without showing Paddle Stack rules", () => {
    render(
      <PlaySetupForm
        sessionId="59c6fa3f-3f6f-45f2-bbea-b85bc90aa3a7"
        playerCount={8}
        courtCount={2}
      />
    );
    fireEvent.click(screen.getByRole("radio", { name: /Mix It Up/ }));
    expect(screen.queryByLabelText("Queue rule")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Round timer" })).toBeVisible();
    expect(screen.getByText(/new partners and fair rests/i)).toBeVisible();
  });

  it("offers Balanced Mix and explains missing experience without blocking play", () => {
    render(
      <PlaySetupForm
        sessionId="59c6fa3f-3f6f-45f2-bbea-b85bc90aa3a7"
        playerCount={4}
        courtCount={1}
        players={[
          ...players
            .slice(0, 3)
            .map((player) => ({ ...player, skillLevel: "regular" })),
          players[3],
        ]}
      />
    );
    fireEvent.click(screen.getByRole("radio", { name: /Balanced Mix/ }));
    expect(screen.getByText(/1 player has no experience set/)).toBeVisible();
    expect(screen.getByRole("button", { name: "Start Play" })).toBeEnabled();
  });

  it("only enables Court Climb when every court has exactly four players", () => {
    const { rerender } = render(
      <PlaySetupForm
        sessionId="59c6fa3f-3f6f-45f2-bbea-b85bc90aa3a7"
        playerCount={7}
        courtCount={2}
      />
    );
    expect(screen.getByRole("radio", { name: /Court Climb/ })).toBeDisabled();
    expect(
      screen.getByText("Needs exactly 8 active players for 2 courts.")
    ).toBeVisible();
    rerender(
      <PlaySetupForm
        sessionId="59c6fa3f-3f6f-45f2-bbea-b85bc90aa3a7"
        playerCount={8}
        courtCount={2}
      />
    );
    expect(screen.getByRole("radio", { name: /Court Climb/ })).toBeEnabled();
  });
});

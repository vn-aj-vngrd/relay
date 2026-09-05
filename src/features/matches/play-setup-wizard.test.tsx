import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("./actions", () => ({ startPlay: vi.fn(async () => ({})) }));

import { PlaySetupWizard } from "./play-setup-wizard";

const players = ["Van", "AJ", "Mika", "John"].map((name, index) => ({
  id: `00000000-0000-4000-8000-00000000000${index + 1}`,
  name,
}));
const readiness = { ready: true };
const play = {
  sessionId: "session",
  playerCount: 4,
  courtCount: 1,
  players,
  activePlayerIds: players.map((player) => player.id),
  readiness,
};

afterEach(cleanup);

describe("PlaySetupWizard", () => {
  it("starts with players, has three steps, and preserves options when going back", () => {
    render(<PlaySetupWizard arrivals={<p>Arrival controls</p>} play={play} />);
    expect(screen.getByText("Step 1 of 3")).toBeVisible();
    expect(screen.getByText("Arrival controls")).toBeVisible();
    expect(screen.queryByText("Arrangements")).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Start Play" })
    ).not.toBeInTheDocument();
    fireEvent.click(
      screen.getByRole("button", { name: "Continue to game options" })
    );
    fireEvent.click(screen.getByRole("radio", { name: /Mix It Up/ }));
    fireEvent.click(screen.getByRole("button", { name: "Review setup" }));
    expect(
      screen.getByRole("heading", { name: "Review Play setup" })
    ).toBeVisible();
    expect(screen.getByText("Step 3 of 3")).toBeVisible();
    expect(screen.getByRole("button", { name: "Start Play" })).toBeEnabled();
    expect(screen.queryByText("Payment")).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Back" }));
    expect(screen.getByRole("radio", { name: /Mix It Up/ })).toBeChecked();
  });
  it("requires enough eligible players before game options", () => {
    render(
      <PlaySetupWizard
        arrivals={<p>Only three here</p>}
        play={{ ...play, playerCount: 3 }}
      />
    );
    expect(
      screen.getByRole("button", { name: "Continue to game options" })
    ).toBeDisabled();
  });
});

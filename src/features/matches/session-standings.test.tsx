import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { SessionStandings } from "./session-standings";

describe("SessionStandings", () => {
  it("does not invent standings before a completed result", () => {
    render(<SessionStandings standings={[]} />);
    expect(screen.queryByRole("table")).not.toBeInTheDocument();
  });

  it("preserves full names and signed point differences", () => {
    render(
      <SessionStandings
        standings={[
          {
            playerId: "player",
            name: "Francesca Dela Cruz",
            played: 3,
            wins: 2,
            losses: 1,
            pointsFor: 30,
            pointsAgainst: 27,
            differential: 3,
            winPercentage: 2 / 3,
          },
        ]}
      />
    );
    const row = screen.getByRole("row", { name: /Francesca Dela Cruz/ });
    expect(within(row).getByText("+3")).toBeInTheDocument();
    expect(within(row).getByText("67%")).toBeInTheDocument();
    expect(within(row).getByText("Francesca Dela Cruz")).not.toHaveClass(
      "truncate"
    );
  });
});

import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { MatchResultScores } from "./match-result-scores";

describe("MatchResultScores", () => {
  it("moves the winner indicator when a corrected score changes the winner", () => {
    const view = render(
      <MatchResultScores
        teams={["Alex + Bea", "Casey + Drew"]}
        scores={[11, 8]}
      />
    );
    expect(
      within(screen.getByText("Winner").parentElement!).getByText("Alex + Bea")
    ).toBeVisible();
    view.rerender(
      <MatchResultScores
        teams={["Alex + Bea", "Casey + Drew"]}
        scores={[8, 11]}
      />
    );
    expect(
      within(screen.getByText("Winner").parentElement!).getByText(
        "Casey + Drew"
      )
    ).toBeVisible();
    expect(screen.getAllByText("Winner")).toHaveLength(1);
  });
  it("does not invent a winner for tied imported scores", () => {
    render(
      <MatchResultScores
        teams={["Alex + Bea", "Casey + Drew"]}
        scores={[8, 8]}
      />
    );
    expect(screen.queryByText("Winner")).not.toBeInTheDocument();
  });
});

import { fireEvent, render, screen } from "@testing-library/react";
import { beforeAll, describe, expect, it, vi } from "vitest";

vi.mock("./actions", () => ({
  correctCompletedScore: vi.fn(async () => ({})),
}));

import { type CompletedMatchResult, MatchResults } from "./match-results";

beforeAll(() => {
  HTMLDialogElement.prototype.showModal = function showModal() {
    this.setAttribute("open", "");
  };
  HTMLDialogElement.prototype.close = function close() {
    this.removeAttribute("open");
  };
});

const result: CompletedMatchResult = {
  id: "00000000-0000-4000-8000-000000000002",
  courtLabel: "Court 2",
  teams: ["Van + Mika", "AJ + Bea"],
  scores: [11, 8],
  version: 4,
};

describe("MatchResults", () => {
  it("shows the same factual result without management controls to viewers", () => {
    render(
      <MatchResults
        sessionId="00000000-0000-4000-8000-000000000001"
        results={[result]}
      />
    );

    expect(screen.getByText("Van + Mika")).toBeVisible();
    expect(screen.getByText("AJ + Bea")).toBeVisible();
    expect(screen.getByText("11")).toBeVisible();
    expect(
      screen.queryByRole("button", { name: "Correct Court 2 score" })
    ).not.toBeInTheDocument();
  });

  it("lets a host review a correction without implying that later rotations change", () => {
    render(
      <MatchResults
        sessionId="00000000-0000-4000-8000-000000000001"
        results={[result]}
        canCorrect
      />
    );

    fireEvent.click(
      screen.getByRole("button", { name: "Correct Court 2 score" })
    );

    const dialog = screen.getByRole("dialog", {
      name: "Correct Court 2 score",
    });
    expect(dialog).toHaveAttribute("open");
    expect(
      screen.getByText(/Later court assignments stay as played/)
    ).toBeVisible();
    expect(screen.getByRole("spinbutton", { name: "Van + Mika" })).toHaveValue(
      11
    );
    expect(screen.getByRole("spinbutton", { name: "AJ + Bea" })).toHaveValue(8);
  });
});

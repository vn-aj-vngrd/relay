import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { buildSessionRecap } from "./recap";
import { RecapShareCard } from "./recap-share-card";

const recap = buildSessionRecap(
  [
    {
      id: "match",
      courtLabel: "Court 1",
      teamA: ["a", "b"],
      teamB: ["c", "d"],
      scoreA: 11,
      scoreB: 8,
      status: "completed",
      startedAt: new Date("2026-08-19T10:00:00Z"),
      finishedAt: new Date("2026-08-19T10:12:00Z"),
    },
  ],
  [
    { id: "a", name: "Van" },
    { id: "b", name: "AJ" },
    { id: "c", name: "Mika" },
    { id: "d", name: "Bea" },
  ],
);

function renderCard() {
  return render(
    <RecapShareCard
      title="Saturday Night Pickle"
      venue="Central Pickle"
      date="August 19, 2026"
      accent="#635bde"
      recap={recap}
      photos={[]}
      viewerPlayerId="a"
    />,
  );
}

describe("RecapShareCard", () => {
  it("lets a participant move through supported portrait stories", () => {
    renderCard();

    expect(screen.getByText("Night recap · 1 of 7")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Next recap story" }));
    expect(screen.getByText("My game · 2 of 7")).toBeInTheDocument();

    fireEvent.keyDown(screen.getByRole("region", { name: "Shareable recap stories" }), { key: "ArrowRight" });
    expect(screen.getByText("Winning team · 3 of 7")).toBeInTheDocument();
  });

  it("offers clean backgrounds and explains how to add a photo", () => {
    renderCard();

    expect(screen.getByRole("radio", { name: "Court background" })).toBeChecked();
    expect(screen.getByRole("radio", { name: "Paper background" })).toBeEnabled();
    expect(screen.getByText("Add a photo below to use it as the story background.")).toBeInTheDocument();
  });
});

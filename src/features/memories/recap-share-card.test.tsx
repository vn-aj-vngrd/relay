import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { buildSessionRecap } from "./recap";
import { RecapShareCard } from "./recap-share-card";

vi.mock("@/features/analytics/actions", () => ({
  trackSharedSessionEvent: vi.fn(),
}));

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
  ]
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
    />
  );
}

describe("RecapShareCard", () => {
  it("offers many truthful portrait stories", () => {
    renderCard();

    expect(screen.getByText("Night recap · 1 of 11")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Points played/ })).toBeEnabled();
    expect(screen.getByRole("button", { name: /Court time/ })).toBeEnabled();
    expect(screen.getByRole("button", { name: /The crew/ })).toBeEnabled();
    expect(screen.getByRole("button", { name: /Your story/ })).toBeEnabled();
    fireEvent.click(screen.getByRole("button", { name: "Next story" }));
    expect(screen.getByText("My game · 2 of 11")).toBeInTheDocument();

    fireEvent.keyDown(
      screen.getByRole("region", { name: "Shareable memory stories" }),
      { key: "ArrowRight" }
    );
    expect(screen.getByText("Winning team · 3 of 11")).toBeInTheDocument();
  });

  it("combines layout, palette, personal copy, and explicit export controls", () => {
    renderCard();

    expect(
      screen.getByRole("radio", { name: "Court background" })
    ).toBeChecked();
    expect(
      screen.getByRole("radio", { name: "Optic background" })
    ).toBeEnabled();
    expect(screen.getByRole("button", { name: /Snapshot/ })).toBeEnabled();
    expect(screen.getByLabelText(/Personal line/)).toHaveAttribute(
      "maxlength",
      "72"
    );
    expect(screen.getByRole("button", { name: "Share story" })).toBeEnabled();
    expect(screen.getByRole("button", { name: "Download PNG" })).toBeEnabled();
    expect(screen.getByText(/1080 × 1920/)).toBeVisible();
  });

  it("uses a valid device photo without uploading it", async () => {
    const objectUrl = vi
      .spyOn(URL, "createObjectURL")
      .mockReturnValue("blob:story-photo");
    renderCard();
    const file = new File(
      [new Uint8Array([0x89, 0x50, 0x4e, 0x47])],
      "court.png",
      { type: "image/png" }
    );

    fireEvent.change(screen.getByLabelText("Choose background photo file"), {
      target: { files: [file] },
    });

    await waitFor(() => expect(objectUrl).toHaveBeenCalledWith(file));
    expect(screen.getByRole("status")).toHaveTextContent(
      "hasn’t been uploaded"
    );
    expect(screen.getByLabelText(/Photo position/)).toBeVisible();
    expect(screen.getByRole("button", { name: /Snapshot/ })).toHaveAttribute(
      "aria-pressed",
      "true"
    );
  });
});

import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import type { ComponentProps } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

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

const baseProps: ComponentProps<typeof RecapShareCard> = {
  title: "Saturday Night Pickle",
  venue: "Central Pickle",
  date: "August 19, 2026 · 6:00–8:00 PM",
  accent: "#635bde",
  recap,
  photos: [],
  viewerPlayerId: "a",
};

function renderCard(overrides: Partial<typeof baseProps> = {}) {
  return render(<RecapShareCard {...baseProps} {...overrides} />);
}

beforeEach(() => {
  HTMLDialogElement.prototype.showModal = function showModal() {
    this.setAttribute("open", "");
  };
  HTMLDialogElement.prototype.close = function close() {
    this.removeAttribute("open");
  };
});

describe("RecapShareCard", () => {
  it("offers many truthful portrait stories", () => {
    renderCard();

    expect(screen.getByText("Night recap · 1 of 11")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Points played" })).toBeEnabled();
    expect(screen.getByRole("button", { name: "Court time" })).toBeEnabled();
    expect(screen.getByRole("button", { name: "The crew" })).toBeEnabled();
    expect(screen.getByRole("button", { name: "Your story" })).toBeEnabled();
    fireEvent.click(screen.getByRole("button", { name: "Next story" }));
    expect(screen.getByText("My game · 2 of 11")).toBeInTheDocument();

    fireEvent.keyDown(
      screen.getByRole("region", { name: "Shareable memory stories" }),
      { key: "ArrowRight" }
    );
    expect(screen.getByText("Winning team · 3 of 11")).toBeInTheDocument();
  });

  it("opens a larger preview with navigation and sharing controls", () => {
    renderCard();

    fireEvent.click(
      screen.getByRole("button", { name: "Expand story preview" })
    );

    const dialog = screen.getByRole("dialog", {
      name: "Saturday Night Pickle",
    });
    expect(dialog).toBeVisible();
    expect(
      screen.getByRole("button", { name: "Previous expanded story" })
    ).toBeEnabled();
    expect(screen.getAllByRole("button", { name: "Share story" })).toHaveLength(
      2
    );
    expect(
      screen.getAllByRole("button", { name: "Download PNG" })
    ).toHaveLength(2);

    fireEvent.click(
      screen.getByRole("button", { name: "Close expanded story" })
    );
    expect(dialog).not.toHaveAttribute("open");
  });

  it("combines layout, palette, personal copy, and explicit export controls", () => {
    renderCard();

    expect(
      screen.getByRole("group", { name: "Story focus" }).parentElement
        ?.parentElement
    ).toHaveClass("mt-3");
    fireEvent.click(screen.getByText("Customize story"));
    expect(
      screen.getByRole("radio", { name: "Violet background" })
    ).toBeChecked();
    expect(
      screen.getByRole("radio", { name: "Court blue background" })
    ).toBeEnabled();
    expect(screen.getByRole("button", { name: "Snapshot" })).toBeEnabled();
    expect(
      screen.getByRole("group", { name: "Story look" }).parentElement
        ?.parentElement
    ).toHaveClass("mt-3");
    expect(screen.getByLabelText(/Personal line/)).toHaveAttribute(
      "maxlength",
      "72"
    );
    expect(screen.getByRole("button", { name: "Share story" })).toBeEnabled();
    expect(screen.getByRole("button", { name: "Download PNG" })).toBeEnabled();
    expect(
      screen.queryByRole("button", { name: "Copy link" })
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Show QR" })
    ).not.toBeInTheDocument();
    expect(screen.getByText("Layout")).toBeVisible();
    expect(screen.getByText("Background")).toBeVisible();
    expect(screen.getByText("Message")).toBeVisible();
  });

  it("uses the game color as the default story background", () => {
    renderCard({ accent: "#bd4545" });
    fireEvent.click(screen.getByText("Customize story"));

    expect(
      screen.getByRole("radio", { name: "Coral background" })
    ).toBeChecked();
  });

  it("uses a valid device photo without uploading it", async () => {
    const objectUrl = vi
      .spyOn(URL, "createObjectURL")
      .mockReturnValue("blob:story-photo");
    renderCard();
    fireEvent.click(screen.getByText("Customize story"));
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
    expect(screen.getByRole("button", { name: "Snapshot" })).toHaveAttribute(
      "aria-pressed",
      "true"
    );
  });

  it("uses phase-aware facts and actions before and during play", () => {
    const { rerender } = renderCard({
      phase: "published",
      invitation: {
        hostName: "Van",
        priceLabel: "Free",
        goingCount: 8,
        capacity: 8,
        requiresApproval: false,
        waitlistOpen: true,
      },
      courtCount: 3,
    });
    expect(screen.getByText("Free")).toBeVisible();
    expect(screen.getByText("8/8")).toBeVisible();
    expect(screen.getByText("Full · waitlist open")).toBeVisible();
    expect(screen.getByRole("button", { name: "Who’s in?" })).toBeEnabled();
    expect(
      screen.getByRole("button", { name: "Share invitation" })
    ).toBeEnabled();

    rerender(<RecapShareCard {...baseProps} phase="live" courtCount={3} />);
    fireEvent.click(screen.getByRole("button", { name: "We’re playing" }));
    expect(screen.getByText("completed matches")).toBeVisible();
    expect(screen.getByText("3")).toBeVisible();
    expect(screen.getByRole("button", { name: "Match pulse" })).toBeEnabled();
    expect(
      screen.getByRole("button", { name: "Share live update" })
    ).toBeEnabled();
    expect(screen.queryByText("Van")).not.toBeInTheDocument();
  });
});

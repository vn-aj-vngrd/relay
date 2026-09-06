import {
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import type { ComponentProps } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { buildSessionRecap } from "./recap";
import { RecapShareCard } from "./recap-share-card";
import * as storyTheme from "./story-theme";

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
  vi.stubGlobal(
    "ResizeObserver",
    class {
      observe() {}
      disconnect() {}
    }
  );
  vi.stubGlobal(
    "createImageBitmap",
    vi.fn().mockResolvedValue({ width: 2, height: 2, close: vi.fn() })
  );
  HTMLDialogElement.prototype.showModal = function showModal() {
    this.setAttribute("open", "");
  };
  HTMLDialogElement.prototype.close = function close() {
    this.removeAttribute("open");
  };
});

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
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
    expect(screen.getByRole("button", { name: "Snapshot" })).toBeEnabled();
    expect(
      screen.getByRole("group", { name: "Story look" }).parentElement
        ?.parentElement
    ).toHaveClass("mt-3");
    fireEvent.click(screen.getByRole("button", { name: "Background" }));
    expect(
      screen.getByRole("button", { name: "Violet background" })
    ).toHaveAttribute("aria-pressed", "true");
    expect(
      screen.getByRole("button", { name: "Court blue background" })
    ).toBeEnabled();
    fireEvent.click(screen.getByRole("button", { name: "Message" }));
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
    expect(screen.getByRole("button", { name: "Layout" })).toBeVisible();
    expect(screen.getByRole("button", { name: "Background" })).toBeVisible();
    expect(screen.getByRole("button", { name: "Message" })).toBeVisible();
  });

  it("keeps exports before progressive tools and retains edits when tools close", () => {
    renderCard();
    const customize = screen.getByRole("button", { name: /Customize story/ });
    const download = screen.getByRole("button", { name: "Download PNG" });
    expect(
      download.compareDocumentPosition(customize) &
        Node.DOCUMENT_POSITION_FOLLOWING
    ).toBeTruthy();
    fireEvent.click(customize);
    expect(screen.queryByLabelText(/Personal line/)).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Message" }));
    fireEvent.change(screen.getByLabelText(/Personal line/), {
      target: { value: "See you next week." },
    });
    fireEvent.click(screen.getByRole("button", { name: "Done customizing" }));
    expect(customize).toHaveFocus();
    expect(customize).toHaveAttribute("aria-expanded", "false");
    fireEvent.click(customize);
    expect(screen.getByLabelText(/Personal line/)).toHaveValue(
      "See you next week."
    );
  });

  it("ignores vertical scrolling and cancelled touches but accepts a deliberate swipe", () => {
    renderCard();
    const preview = screen.getByRole("button", {
      name: "Expand story preview",
    });
    fireEvent.touchStart(preview, {
      touches: [{ clientX: 180, clientY: 100 }],
    });
    fireEvent.touchEnd(preview, {
      changedTouches: [{ clientX: 100, clientY: 260 }],
    });
    expect(screen.getByText("Night recap · 1 of 11")).toBeVisible();
    fireEvent.touchStart(preview, {
      touches: [{ clientX: 180, clientY: 100 }],
    });
    fireEvent.touchCancel(preview);
    fireEvent.touchEnd(preview, {
      changedTouches: [{ clientX: 50, clientY: 100 }],
    });
    expect(screen.getByText("Night recap · 1 of 11")).toBeVisible();
    fireEvent.touchStart(preview, {
      touches: [{ clientX: 180, clientY: 100 }],
    });
    fireEvent.touchEnd(preview, {
      changedTouches: [{ clientX: 50, clientY: 105 }],
    });
    expect(screen.getByText("My game · 2 of 11")).toBeVisible();
  });

  it("supports keyboard focus navigation inside the expanded preview", () => {
    renderCard();
    fireEvent.click(
      screen.getByRole("button", { name: "Expand story preview" })
    );
    const dialog = screen.getByRole("dialog", { name: baseProps.title });
    fireEvent.keyDown(dialog, { key: "ArrowRight" });
    expect(within(dialog).getByText("My game · 2 of 11")).toBeVisible();
  });

  it.each([
    ...storyTheme.storyThemes.map((theme) => ({
      ...theme,
      pink: theme.id === "coquette",
    })),
    { id: "coquette" as const, label: "Coquette", pink: false },
  ])(
    "exports $label (Pink: $pink) with the same selected theme and full PNG dimensions",
    async ({ id, label, pink }) => {
      const fillColors: string[] = [];
      const context = {
        fillStyle: "#000000",
        fillRect: vi.fn(function (this: CanvasRenderingContext2D) {
          fillColors.push(String(this.fillStyle));
        }),
        strokeRect: vi.fn(),
        beginPath: vi.fn(),
        arc: vi.fn(),
        fill: vi.fn(),
        stroke: vi.fn(),
        moveTo: vi.fn(),
        lineTo: vi.fn(),
        fillText: vi.fn(),
        save: vi.fn(),
        restore: vi.fn(),
        translate: vi.fn(),
        drawImage: vi.fn(),
        measureText: vi.fn(() => ({ width: 100 })),
      };
      vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue(
        context as unknown as CanvasRenderingContext2D
      );
      const dimensions: number[][] = [];
      vi.spyOn(HTMLCanvasElement.prototype, "toBlob").mockImplementation(
        function (this: HTMLCanvasElement, callback) {
          dimensions.push([this.width, this.height]);
          callback(new Blob(["synthetic PNG"], { type: "image/png" }));
        }
      );
      vi.spyOn(URL, "createObjectURL").mockReturnValue("blob:synthetic-story");
      vi.spyOn(URL, "revokeObjectURL").mockImplementation(() => undefined);
      vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(
        () => undefined
      );
      vi.stubGlobal("Path2D", class {});
      const decoration = vi.spyOn(storyTheme, "drawStoryTheme");
      const fetchPhoto = vi
        .fn()
        .mockRejectedValue(new TypeError("CSP blocks blob fetch"));
      vi.stubGlobal("fetch", fetchPhoto);
      renderCard();
      fireEvent.click(screen.getByText("Customize story"));
      expect(screen.getByRole("button", { name: "Minimal" })).toHaveAttribute(
        "aria-pressed",
        "true"
      );
      fireEvent.click(screen.getByRole("button", { name: label }));
      if (pink) {
        fireEvent.click(screen.getByRole("button", { name: "Background" }));
        fireEvent.click(
          screen.getByRole("button", { name: "Pink background" })
        );
        expect(
          screen.getByRole("button", { name: "Pink background" })
        ).toHaveAttribute("aria-pressed", "true");
      } else if (id !== "minimal") {
        fireEvent.click(screen.getByRole("button", { name: "Background" }));
        fireEvent.change(
          screen.getByLabelText("Choose background photo file"),
          {
            target: {
              files: [
                new File(
                  [new Uint8Array([0x89, 0x50, 0x4e, 0x47])],
                  "court.png",
                  { type: "image/png" }
                ),
              ],
            },
          }
        );
        await waitFor(() =>
          expect(screen.getByRole("status")).toHaveTextContent(
            "hasn’t been uploaded"
          )
        );
      }
      fireEvent.click(
        screen.getByRole("button", { name: "Expand story preview" })
      );
      const dialog = screen.getByRole("dialog", { name: baseProps.title });
      expect(dialog.querySelector("[data-story-theme]")).toHaveAttribute(
        "data-story-theme",
        id
      );
      fireEvent.click(
        within(dialog).getByRole("button", { name: "Download PNG" })
      );
      await waitFor(() =>
        expect(within(dialog).getByRole("status")).toHaveTextContent(
          "1080 × 1920"
        )
      );
      expect(dimensions).toEqual([[1080, 1920]]);
      expect(decoration).toHaveBeenCalledWith(context, id);
      expect(fillColors[0]).toBe(
        pink ? "#f6cfdf" : id === "minimal" ? "#635bde" : "#11131a"
      );
      expect(fetchPhoto).not.toHaveBeenCalled();
      if (pink) {
        expect(dialog.querySelector("[data-story-theme]")).toHaveStyle({
          backgroundColor: "#f6cfdf",
        });
        expect(dialog.querySelector("[data-story-theme]")).toHaveClass(
          "text-[#17181d]"
        );
        expect(context.drawImage).not.toHaveBeenCalled();
      } else if (id !== "minimal")
        expect(context.drawImage).toHaveBeenCalledOnce();
    }
  );

  it("keeps the working background when a supported file cannot be decoded", async () => {
    vi.mocked(createImageBitmap).mockRejectedValue(new Error("Invalid image"));
    renderCard();
    fireEvent.click(screen.getByText("Customize story"));
    fireEvent.click(screen.getByRole("button", { name: "Background" }));
    fireEvent.change(screen.getByLabelText("Choose background photo file"), {
      target: {
        files: [
          new File([new Uint8Array([0x89, 0x50, 0x4e, 0x47])], "broken.png", {
            type: "image/png",
          }),
        ],
      },
    });
    await waitFor(() =>
      expect(screen.getByRole("status")).toHaveTextContent("couldn’t be read")
    );
    expect(
      screen.getByRole("button", { name: "Violet background" })
    ).toHaveAttribute("aria-pressed", "true");
  });

  it("uses the game color as the default story background", () => {
    renderCard({ accent: "#bd4545" });
    fireEvent.click(screen.getByText("Customize story"));

    fireEvent.click(screen.getByRole("button", { name: "Background" }));
    expect(
      screen.getByRole("button", { name: "Coral background" })
    ).toHaveAttribute("aria-pressed", "true");
  });

  it("uses a valid device photo without uploading it", async () => {
    const objectUrl = vi
      .spyOn(URL, "createObjectURL")
      .mockReturnValue("blob:story-photo");
    renderCard();
    fireEvent.click(screen.getByText("Customize story"));
    fireEvent.click(screen.getByRole("button", { name: "Background" }));
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
    fireEvent.click(screen.getByRole("button", { name: "Layout" }));
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

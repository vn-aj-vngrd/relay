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
import * as storyPhoto from "./story-photo";
import { storyScene } from "./story-scene";
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

  it("offers an explicit enlarge action and identifies the export format", () => {
    renderCard();

    expect(
      screen.getByText("9:16 portrait · Ready for stories and sharing")
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Download PNG" })
    ).toHaveTextContent("Download PNG");
    fireEvent.click(screen.getByRole("button", { name: "Enlarge preview" }));
    expect(
      screen.getByRole("dialog", { name: "Saturday Night Pickle" })
    ).toBeVisible();
  });

  it("combines layout, palette, personal copy, and explicit export controls", () => {
    renderCard();

    expect(
      screen.getByRole("group", { name: "Story focus options" }).parentElement
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
        scale: vi.fn(),
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
          screen.getByRole("button", { name: "Baby Pink background" })
        );
        expect(
          screen.getByRole("button", { name: "Baby Pink background" })
        ).toHaveAttribute("aria-pressed", "true");
      } else if (id !== "minimal") {
        fireEvent.click(screen.getByRole("button", { name: "Background" }));
        fireEvent.change(screen.getByLabelText("Choose story photo file"), {
          target: {
            files: [
              new File(
                [new Uint8Array([0x89, 0x50, 0x4e, 0x47])],
                "court.png",
                { type: "image/png" }
              ),
            ],
          },
        });
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
        pink ? "#ffe0eb" : id === "minimal" ? "#635bde" : "#11131a"
      );
      expect(fetchPhoto).not.toHaveBeenCalled();
      if (pink) {
        expect(dialog.querySelector("[data-story-theme]")).toHaveStyle({
          backgroundColor: "#ffe0eb",
        });
        expect(dialog.querySelector("[data-story-theme]")).toHaveClass(
          "text-[#17181d]"
        );
        expect(context.drawImage).not.toHaveBeenCalled();
      } else if (id !== "minimal")
        expect(context.drawImage).toHaveBeenCalledOnce();
    }
  );

  it.each(
    storyTheme.storyThemes.flatMap(({ id: theme, label: themeLabel }) =>
      ["Courtside", "Center court", "Poster", "Snapshot"].flatMap(
        (layoutLabel) =>
          (["none", "top", "center", "bottom"] as const)
            .filter((placement) => theme !== "minimal" || placement !== "none")
            .map((placement) => ({ theme, themeLabel, layoutLabel, placement }))
      )
    )
  )(
    "contains transformed Match pulse text for $theme / $layoutLabel / $placement",
    async ({ theme, themeLabel, layoutLabel, placement }) => {
      let transform = { scale: 1, y: 0 };
      const stack: Array<typeof transform> = [];
      const textBounds: Array<{
        text: string;
        baseline: number;
        top: number;
        bottom: number;
      }> = [];
      const context = {
        font: "700 30px Arial",
        fillRect: vi.fn(),
        beginPath: vi.fn(),
        arc: vi.fn(),
        fill: vi.fn(),
        moveTo: vi.fn(),
        lineTo: vi.fn(),
        stroke: vi.fn(),
        save: () => {
          stack.push({ ...transform });
        },
        restore: () => {
          transform = stack.pop() ?? { scale: 1, y: 0 };
        },
        translate: (_x: number, y: number) => {
          transform.y += y * transform.scale;
        },
        scale: (_x: number, y: number) => {
          transform.scale *= y;
        },
        measureText(text: string) {
          const size = Number(this.font.match(/(\d+)px/)?.[1] ?? 30);
          return {
            width: text.length * size * 0.5,
            actualBoundingBoxAscent: size * 0.8,
            actualBoundingBoxDescent: size * 0.25,
            fontBoundingBoxDescent: size * 0.3,
          };
        },
        fillText(text: string, _x: number, baseline: number) {
          const metrics = this.measureText(text);
          textBounds.push({
            text,
            baseline,
            top:
              transform.y +
              (baseline - metrics.actualBoundingBoxAscent) * transform.scale,
            bottom:
              transform.y +
              (baseline + metrics.actualBoundingBoxDescent) * transform.scale,
          });
        },
      };
      vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue(
        context as unknown as CanvasRenderingContext2D
      );
      vi.spyOn(HTMLCanvasElement.prototype, "toBlob").mockImplementation(
        (callback) => callback(new Blob(["PNG"], { type: "image/png" }))
      );
      vi.spyOn(URL, "createObjectURL").mockReturnValue("blob:export");
      vi.spyOn(URL, "revokeObjectURL").mockImplementation(() => undefined);
      vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(
        () => undefined
      );
      vi.spyOn(storyPhoto, "drawStoryPhoto").mockResolvedValue(undefined);
      vi.stubGlobal("Path2D", class {});
      renderCard({
        phase: "live",
        title: "Saturday evening pickleball with all our friends together",
        venue:
          "The community pickleball courts beside the riverside recreation pavilion and the neighborhood sporting grounds",
        photos: [{ id: "court", url: "/court.png", alt: "Our court" }],
      });
      fireEvent.click(screen.getByRole("button", { name: "Match pulse" }));
      fireEvent.click(screen.getByText("Customize story"));
      fireEvent.click(screen.getByRole("button", { name: themeLabel }));
      fireEvent.click(screen.getByRole("button", { name: layoutLabel }));
      if (placement !== "none") {
        fireEvent.click(screen.getByRole("button", { name: "Background" }));
        fireEvent.click(screen.getByRole("button", { name: "Our court" }));
        fireEvent.click(
          screen.getByRole("button", { name: "Framed foreground" })
        );
        fireEvent.click(
          within(
            screen.getByRole("group", { name: "Photo placement" })
          ).getByRole("button", {
            name: placement[0].toUpperCase() + placement.slice(1),
          })
        );
      }
      if (placement === "center") {
        fireEvent.click(screen.getByRole("button", { name: "Message" }));
        fireEvent.change(screen.getByLabelText(/Personal line/), {
          target: {
            value:
              "Another wonderful evening together with all our pickleball friends again",
          },
        });
      }
      fireEvent.click(screen.getByRole("button", { name: "Download PNG" }));
      await waitFor(() =>
        expect(screen.getByRole("status")).toHaveTextContent("1080 × 1920")
      );
      const facts = storyScene(
        theme,
        placement !== "none",
        "foreground",
        placement === "none" ? "center" : placement
      ).facts;
      const renderedFacts = textBounds.filter(
        ({ baseline }) => baseline >= 940 && baseline < 1880
      );
      // These are bounds of the renderer's actual fillText calls after its affine
      // transform, not merely a comparison of the shared scene's rectangles.
      expect(renderedFacts.some(({ baseline }) => baseline === 1688)).toBe(
        true
      );
      expect(renderedFacts.some(({ baseline }) => baseline === 1562)).toBe(
        true
      );
      if (placement === "center")
        expect(renderedFacts.some(({ baseline }) => baseline === 1673)).toBe(
          true
        );
      for (const text of renderedFacts) {
        expect(text.top).toBeGreaterThanOrEqual(facts.y - 0.01);
        expect(text.bottom).toBeLessThanOrEqual(facts.y + facts.height + 0.01);
      }
    }
  );

  it.each(["top", "center", "bottom"] as const)(
    "preserves local photo/crop across theme/layout edits and exports %s foreground",
    async (placement) => {
      const context = {
        fillRect: vi.fn(),
        beginPath: vi.fn(),
        arc: vi.fn(),
        fill: vi.fn(),
        fillText: vi.fn(),
        moveTo: vi.fn(),
        lineTo: vi.fn(),
        stroke: vi.fn(),
        save: vi.fn(),
        restore: vi.fn(),
        translate: vi.fn(),
        scale: vi.fn(),
        measureText: vi.fn(() => ({ width: 100 })),
      };
      vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue(
        context as unknown as CanvasRenderingContext2D
      );
      vi.spyOn(HTMLCanvasElement.prototype, "toBlob").mockImplementation(
        (callback) => callback(new Blob(["PNG"], { type: "image/png" }))
      );
      vi.spyOn(URL, "createObjectURL").mockReturnValue("blob:local-photo");
      vi.spyOn(URL, "revokeObjectURL").mockImplementation(() => undefined);
      vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(
        () => undefined
      );
      vi.stubGlobal("Path2D", class {});
      const draw = vi
        .spyOn(storyPhoto, "drawStoryPhoto")
        .mockResolvedValue(undefined);
      const { container } = renderCard();
      fireEvent.click(screen.getByText("Customize story"));
      fireEvent.click(screen.getByRole("button", { name: "Background" }));
      expect(
        screen.queryByRole("group", { name: "Photo role" })
      ).not.toBeInTheDocument();
      const file = new File(
        [new Uint8Array([0x89, 0x50, 0x4e, 0x47])],
        "court.png",
        { type: "image/png" }
      );
      fireEvent.change(screen.getByLabelText("Choose story photo file"), {
        target: { files: [file] },
      });
      await waitFor(() =>
        expect(screen.getByLabelText("Photo crop")).toBeVisible()
      );
      expect(
        screen.getByRole("button", { name: "Full background" })
      ).toHaveAttribute("aria-pressed", "true");
      fireEvent.change(screen.getByLabelText("Photo crop"), {
        target: { value: "75" },
      });
      fireEvent.click(
        screen.getByRole("button", { name: "Framed foreground" })
      );
      fireEvent.click(
        screen.getByRole("button", {
          name: placement[0].toUpperCase() + placement.slice(1),
        })
      );
      fireEvent.click(
        screen.getByRole("button", { name: "Baby Pink background" })
      );
      expect(screen.queryByLabelText("Text contrast")).not.toBeInTheDocument();
      fireEvent.click(screen.getByRole("button", { name: "Layout" }));
      fireEvent.click(screen.getByRole("button", { name: "Coquette" }));
      fireEvent.click(screen.getByRole("button", { name: "Poster" }));
      const preview = container.querySelector("[data-story-theme]");
      expect(preview).toHaveAttribute("data-photo-placement", placement);
      expect(preview).toHaveStyle({ backgroundColor: "#ffe0eb" });
      expect(
        preview?.querySelector("[data-story-region=photo] img")
      ).toHaveStyle({ objectPosition: "center 75%" });
      fireEvent.click(screen.getByRole("button", { name: "Download PNG" }));
      await waitFor(() =>
        expect(draw).toHaveBeenCalledWith(
          context,
          file,
          1080,
          1920,
          75,
          storyScene("coquette", true, "foreground", placement).photo
        )
      );
    }
  );

  it("uses the same foreground placement controls for an existing session photo", () => {
    const { container } = renderCard({
      photos: [{ id: "court", url: "/court.png", alt: "Our court" }],
    });
    fireEvent.click(screen.getByText("Customize story"));
    fireEvent.click(screen.getByRole("button", { name: "Background" }));
    fireEvent.click(screen.getByRole("button", { name: "Our court" }));
    fireEvent.click(screen.getByRole("button", { name: "Framed foreground" }));
    fireEvent.click(screen.getByRole("button", { name: "Bottom" }));
    expect(container.querySelector("[data-story-theme]")).toHaveAttribute(
      "data-photo-placement",
      "bottom"
    );
    fireEvent.click(screen.getByRole("button", { name: "Full background" }));
    expect(container.querySelector("[data-story-theme]")).toHaveAttribute(
      "data-photo-role",
      "background"
    );
    expect(
      screen.queryByRole("group", { name: "Photo placement" })
    ).not.toBeInTheDocument();
    expect(screen.getByLabelText("Text contrast")).toBeVisible();
  });

  it("keeps the working background when a supported file cannot be decoded", async () => {
    vi.mocked(createImageBitmap).mockRejectedValue(new Error("Invalid image"));
    renderCard();
    fireEvent.click(screen.getByText("Customize story"));
    fireEvent.click(screen.getByRole("button", { name: "Background" }));
    fireEvent.change(screen.getByLabelText("Choose story photo file"), {
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

    fireEvent.change(screen.getByLabelText("Choose story photo file"), {
      target: { files: [file] },
    });

    await waitFor(() => expect(objectUrl).toHaveBeenCalledWith(file));
    expect(screen.getByRole("status")).toHaveTextContent(
      "hasn’t been uploaded"
    );
    expect(screen.getByLabelText(/Photo crop/)).toBeVisible();
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

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
import { recapShareTemplates } from "./recap-share";
import { RecapShareCard } from "./recap-share-card";
import * as storyPhoto from "./story-photo";
import { storyRecapLayout } from "./story-recap-layout";
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

// Follow the visible editor controls when exercising older export scenarios.
function clickButton(name: string | RegExp) {
  const themes = [
    "Minimal",
    "Scrapbook",
    "Coquette",
    "Court Pop",
    "Retro Rally",
  ];
  let label = name;
  const panel = (value: string) =>
    fireEvent.click(screen.getByRole("button", { name: value }));
  if (name === "Background") {
    panel("Look");
    return;
  }
  if (name === "Message") {
    panel("Details");
    return;
  }
  if (name === "Framed foreground" || name === "Full background")
    panel("Layout");
  if (
    typeof name === "string" &&
    name !== "Full background" &&
    name.endsWith(" background")
  )
    panel("Look");

  if (typeof name === "string" && themes.includes(name))
    fireEvent.click(screen.getByRole("button", { name: "Look" }));
  if (typeof name === "string" && ["Top", "Center", "Bottom"].includes(name)) {
    fireEvent.click(screen.getByRole("button", { name: "Layout" }));
    label = { Top: "Photo first", Center: "Balanced", Bottom: "Details first" }[
      name as "Top" | "Center" | "Bottom"
    ];
  }
  if (name === "Add your photo" || name === "Change photo") {
    fireEvent.click(screen.getByRole("button", { name: "Photos" }));
    return;
  }
  if (name === "Our court") label = "Use Our court";
  if (typeof label === "string" && label.startsWith("Use "))
    fireEvent.click(screen.getByRole("button", { name: "Photos" }));
  if (name === "Remove photo") {
    fireEvent.click(screen.getByRole("button", { name: "Photos" }));
    fireEvent.click(screen.getByRole("button", { name: /^Edit photo 1:/ }));
  }
  if (!screen.queryByRole("button", { name: label })) panel("Details");
  fireEvent.click(screen.getByRole("button", { name: label }));
}

function openStoryDetails() {
  clickButton("Details");
}

function renderCard(overrides: Partial<typeof baseProps> = {}) {
  const result = render(<RecapShareCard {...baseProps} {...overrides} />);
  openStoryDetails();
  // Existing export/navigation scenarios exercise the expanded controls.
  const moreStories = screen.queryByRole("button", { name: "More stories" });
  if (moreStories) fireEvent.click(moreStories);
  clickButton("Add your photo");
  openStoryDetails();
  // Explicitly exercise Night recap / Court Pop.
  const recapFocus = screen.queryByRole("button", { name: "Night recap" });
  if (recapFocus) fireEvent.click(recapFocus);
  clickButton("Court Pop");
  return result;
}

beforeEach(() => {
  vi.stubGlobal("Path2D", class {});
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
  it("keeps all five visual choices together in Look", () => {
    const { container } = renderCard();
    expect(container.querySelector("[data-story-theme]")).toHaveAttribute(
      "data-story-theme",
      "court-pop"
    );
    const themes = screen.getByRole("group", { name: "Story theme" });
    expect(within(themes).getAllByRole("button")).toHaveLength(5);
    expect(
      within(themes).getByRole("button", { name: "Court Pop" })
    ).toHaveAttribute("aria-pressed", "true");
    expect(screen.queryByText("Customize story")).not.toBeInTheDocument();
    expect(container.querySelectorAll("[data-story-theme]")).toHaveLength(1);
    fireEvent.click(within(themes).getByRole("button", { name: "Minimal" }));
    clickButton("Points played");
    expect(container.querySelector("[data-story-theme]")).toHaveAttribute(
      "data-story-theme",
      "minimal"
    );
  });

  it("only adds a suggested personal line when selected and preserves edits across themes", () => {
    const { container } = renderCard();
    expect(container.querySelector('[data-story-fact="note"]')).toBeNull();
    clickButton("Details");
    clickButton("Message");
    clickButton("Same court next time?");
    expect(screen.getByRole("textbox", { name: /Personal line/ })).toHaveValue(
      "Same court next time?"
    );
    clickButton("Scrapbook");
    expect(
      container.querySelector('[data-story-fact="note"]')
    ).toHaveTextContent("Same court next time?");
    clickButton("Details");
    fireEvent.change(screen.getByRole("textbox", { name: /Personal line/ }), {
      target: { value: "" },
    });
    expect(container.querySelector('[data-story-fact="note"]')).toBeNull();
  });

  it.each([
    ...recapShareTemplates(recap, "a").map((item) => ({
      ...item,
      phase: "completed" as const,
    })),
    ...recapShareTemplates(recap, "a", "live")
      .filter((item) => item.id !== "invitation")
      .map((item) => ({ ...item, phase: "live" as const })),
  ])(
    "uses matching preview/export hierarchy for $label",
    async ({ id, label, phase }) => {
      const context = {
        fillRect: vi.fn(),
        fillText: vi.fn(),
        beginPath: vi.fn(),
        arc: vi.fn(),
        fill: vi.fn(),
        stroke: vi.fn(),
        save: vi.fn(),
        restore: vi.fn(),
        translate: vi.fn(),
        scale: vi.fn(),
      };
      vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue(
        context as unknown as CanvasRenderingContext2D
      );
      vi.spyOn(HTMLCanvasElement.prototype, "toBlob").mockImplementation(
        (callback) => callback(new Blob(["png"], { type: "image/png" }))
      );
      vi.spyOn(URL, "createObjectURL").mockReturnValue("blob:recap");
      vi.spyOn(URL, "revokeObjectURL").mockImplementation(() => undefined);
      vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(
        () => undefined
      );
      const withPhoto = id === "custom";
      if (withPhoto)
        vi.spyOn(storyPhoto, "drawStoryPhoto").mockResolvedValue(undefined);
      const { container } = renderCard({
        phase,
        photos: withPhoto
          ? [{ id: "memory", url: "/memory.jpg", alt: "Memory" }]
          : [],
      });
      clickButton(label);
      if (withPhoto) clickButton("Use Memory");
      const layout = storyRecapLayout({
        ...baseProps,
        template: id,
        theme: "court-pop",
        courtCount: 0,
        customHeadline: "Same court next week?",
        customNote: "",
        hasPhoto: withPhoto,
        photoRole: "foreground",
        photoPlacement: "center",
      })!;
      const facts = container.querySelector(
        '[data-story-region="recap-facts"]'
      )!;
      expect(container.querySelector("[data-story-fitted-content]")).toBeNull();
      for (const block of layout.blocks) {
        const element = facts.querySelector(`[data-story-fact="${block.id}"]`);
        expect(element).toHaveAttribute("font-size", String(block.size));
        expect(element).toHaveAttribute("x", String(block.x));
        expect(element).toHaveAttribute("y", String(block.baseline));
        expect(element).toHaveTextContent(block.lines.join(" "));
      }
      clickButton("Download PNG");
      await waitFor(() =>
        expect(HTMLAnchorElement.prototype.click).toHaveBeenCalledOnce()
      );
      for (const block of layout.blocks) {
        block.lines.forEach((line, index) =>
          expect(context.fillText).toHaveBeenCalledWith(
            line,
            block.x,
            block.baseline + index * block.size * 1.25
          )
        );
      }
      if (!withPhoto) {
        expect(context.scale).toHaveBeenCalled();
        expect(context.translate).toHaveBeenCalled();
      }
    }
  );

  it("offers many truthful portrait stories", () => {
    renderCard();

    expect(screen.getByText("Night recap · 1 of 11")).toBeInTheDocument();
    clickButton("Details");
    expect(screen.getByRole("button", { name: "Points played" })).toBeEnabled();
    expect(screen.getByRole("button", { name: "Court time" })).toBeEnabled();
    expect(screen.getByRole("button", { name: "The crew" })).toBeEnabled();
    expect(screen.getByRole("button", { name: "Your story" })).toBeEnabled();
    clickButton("Next story");
    expect(screen.getByText("My game · 2 of 11")).toBeInTheDocument();

    fireEvent.keyDown(
      screen.getByRole("region", { name: "Shareable memory stories" }),
      { key: "ArrowRight" }
    );
    expect(screen.getByText("Winning team · 3 of 11")).toBeInTheDocument();
  });

  it("opens a larger preview with navigation and sharing controls", () => {
    renderCard();

    clickButton("Expand story preview");

    const dialog = screen.getByRole("dialog", {
      name: "Saturday Night Pickle",
    });
    expect(dialog).toBeVisible();
    expect(
      screen.getByRole("button", { name: "Previous expanded story" })
    ).toBeEnabled();
    expect(screen.getAllByRole("button", { name: "Share Story" })).toHaveLength(
      2
    );
    expect(
      screen.getAllByRole("button", { name: "Download PNG" })
    ).toHaveLength(2);

    clickButton("Close expanded story");
    expect(dialog).not.toHaveAttribute("open");
  });

  it("opens the preview from the story without a separate enlarge control", () => {
    renderCard();

    expect(
      screen.queryByText("9:16 portrait · Ready for stories and sharing")
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Download PNG" })
    ).toHaveTextContent("Download PNG");
    expect(
      screen.queryByRole("button", { name: "Enlarge preview" })
    ).toBeNull();
    clickButton("Expand story preview");
    expect(
      screen.getByRole("dialog", { name: "Saturday Night Pickle" })
    ).toBeVisible();
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
    clickButton("Expand story preview");
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
      clickButton("Details");
      clickButton("Look");
      expect(screen.getByRole("button", { name: "Court Pop" })).toHaveAttribute(
        "aria-pressed",
        "true"
      );
      clickButton(label);
      if (pink) {
        clickButton("Background");
        clickButton("Baby Pink background");
        expect(
          screen.getByRole("button", { name: "Baby Pink background" })
        ).toHaveAttribute("aria-pressed", "true");
      } else if (id !== "minimal") {
        clickButton("Background");
        clickButton("Photos");
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
            "Nothing was uploaded"
          )
        );
        clickButton("Full background");
      }
      clickButton("Expand story preview");
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
      if (id !== "minimal") {
        expect(decoration).toHaveBeenCalledWith(context, id, undefined, {
          subject: "poster",
          accent: pink ? "#ffe0eb" : undefined,
        });
      } else expect(decoration).toHaveBeenCalledWith(context, id);
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
      (["none", "top", "center", "bottom"] as const)
        .filter((placement) => theme !== "minimal" || placement !== "none")
        .map((placement) => ({ theme, themeLabel, placement }))
    )
  )(
    "contains full-width Match pulse text for $theme / $placement",
    async ({ theme, themeLabel, placement }) => {
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
          const size = Number(this.font.match(/([\d.]+)px/)?.[1] ?? 30);
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
      clickButton("Match pulse");
      clickButton("Details");
      clickButton(themeLabel);
      if (placement !== "none") {
        clickButton("Background");
        clickButton("Our court");
        clickButton("Framed foreground");
        clickButton(placement[0].toUpperCase() + placement.slice(1));
      }
      if (placement === "center") {
        clickButton("Message");
        fireEvent.change(
          screen.getByRole("textbox", { name: /Personal line/ }),
          {
            target: {
              value:
                "Another wonderful evening together with all our pickleball friends again",
            },
          }
        );
      }
      clickButton("Download PNG");
      await waitFor(() =>
        expect(screen.getByRole("status")).toHaveTextContent("1080 × 1920")
      );
      const layout = storyRecapLayout({
        ...baseProps,
        template: "live-pulse",
        theme,
        courtCount: 0,
        title: "Saturday evening pickleball with all our friends together",
        venue:
          "The community pickleball courts beside the riverside recreation pavilion and the neighborhood sporting grounds",
        hasPhoto: placement !== "none",
        photoRole: "foreground",
        photoPlacement: placement === "none" ? "center" : placement,
        customHeadline: "",
        customNote:
          placement === "center"
            ? "Another wonderful evening together with all our pickleball friends again"
            : "",
      })!;
      const renderedFacts = textBounds.filter(
        ({ baseline }) => baseline >= 160
      );
      expect(renderedFacts).toHaveLength(
        layout.blocks.reduce((sum, block) => sum + block.lines.length, 0)
      );
      for (const text of renderedFacts) {
        const bounds =
          layout.scene.heading && text.baseline < layout.scene.facts.y
            ? layout.scene.heading
            : layout.scene.facts;
        expect(text.top).toBeGreaterThanOrEqual(bounds.y - 0.01);
        expect(text.bottom).toBeLessThanOrEqual(
          bounds.y + bounds.height + 0.01
        );
      }
    }
  );

  it.each(["top", "center", "bottom"] as const)(
    "preserves local photo/crop across theme edits and exports %s foreground",
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
      clickButton("Details");
      clickButton("Background");
      expect(
        screen.queryByRole("group", { name: "Photo role" })
      ).not.toBeInTheDocument();
      const file = new File(
        [new Uint8Array([0x89, 0x50, 0x4e, 0x47])],
        "court.png",
        { type: "image/png" }
      );
      clickButton("Photos");
      fireEvent.change(screen.getByLabelText("Choose story photo file"), {
        target: { files: [file] },
      });
      await waitFor(() =>
        expect(
          screen.getByRole("button", { name: /^Edit photo 1:/ })
        ).toBeVisible()
      );
      clickButton(/^Edit photo 1:/);
      clickButton("Layout");
      expect(
        screen.getByRole("button", { name: "Framed foreground" })
      ).toHaveAttribute("aria-pressed", "true");
      clickButton("Photos");
      fireEvent.change(screen.getByLabelText("Horizontal crop"), {
        target: { value: "75" },
      });
      fireEvent.change(screen.getByLabelText("Vertical crop"), {
        target: { value: "75" },
      });
      clickButton("Framed foreground");
      clickButton(placement[0].toUpperCase() + placement.slice(1));
      clickButton("Baby Pink background");
      expect(screen.queryByLabelText("Text contrast")).not.toBeInTheDocument();
      clickButton("Coquette");
      const preview = container.querySelector("[data-story-theme]");
      expect(preview).toHaveAttribute("data-photo-placement", placement);
      expect(preview).toHaveStyle({ backgroundColor: "#ffe0eb" });
      expect(
        preview?.querySelector("[data-story-region=photo] img")
      ).toHaveStyle({ objectPosition: "75% 75%" });
      clickButton("Download PNG");
      await waitFor(() =>
        expect(draw).toHaveBeenCalledWith(
          context,
          file,
          1080,
          1920,
          50,
          storyRecapLayout({
            ...baseProps,
            template: "overview",
            theme: "coquette",
            courtCount: 0,
            hasPhoto: true,
            photoRole: "foreground",
            photoPlacement: placement,
            customHeadline: "",
            customNote: "",
          })!.scene.photo,
          { x: 75, y: 75, zoom: 1 }
        )
      );
    }
  );

  it("defaults an existing session photo to framed foreground and allows full background", () => {
    const { container } = renderCard({
      photos: [{ id: "court", url: "/court.png", alt: "Our court" }],
    });
    clickButton("Details");
    clickButton("Background");
    clickButton("Our court");
    clickButton("Layout");
    expect(
      screen.getByRole("button", { name: "Framed foreground" })
    ).toHaveAttribute("aria-pressed", "true");
    expect(container.querySelector("[data-story-theme]")).toHaveAttribute(
      "data-photo-role",
      "foreground"
    );
    clickButton("Bottom");
    expect(container.querySelector("[data-story-theme]")).toHaveAttribute(
      "data-photo-placement",
      "bottom"
    );
    clickButton("Full background");
    expect(container.querySelector("[data-story-theme]")).toHaveAttribute(
      "data-photo-role",
      "background"
    );
    clickButton("Photos");
    expect(
      screen.queryByRole("group", { name: "Photo placement options" })
    ).not.toBeInTheDocument();
    clickButton("Look");
    expect(screen.getByLabelText("Text contrast")).toBeVisible();
  });

  it("keeps the working background when a supported file cannot be decoded", async () => {
    vi.mocked(createImageBitmap).mockRejectedValue(new Error("Invalid image"));
    renderCard();
    clickButton("Details");
    clickButton("Background");
    clickButton("Photos");
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
      expect(screen.getByRole("status")).toHaveTextContent("couldn’t be added")
    );
    clickButton("Look");
    expect(
      screen.getByRole("button", { name: "Violet background" })
    ).toHaveAttribute("aria-pressed", "true");
  });

  it("uses the game color as the default story background", () => {
    renderCard({ accent: "#bd4545" });
    clickButton("Details");

    clickButton("Background");
    expect(
      screen.getByRole("button", { name: "Coral background" })
    ).toHaveAttribute("aria-pressed", "true");
  });

  it("uses a valid device photo without uploading it", async () => {
    const objectUrl = vi
      .spyOn(URL, "createObjectURL")
      .mockReturnValue("blob:story-photo");
    renderCard();
    clickButton("Details");
    clickButton("Background");
    const file = new File(
      [new Uint8Array([0x89, 0x50, 0x4e, 0x47])],
      "court.png",
      { type: "image/png" }
    );

    clickButton("Photos");
    fireEvent.change(screen.getByLabelText("Choose story photo file"), {
      target: { files: [file] },
    });

    await waitFor(() => expect(objectUrl).toHaveBeenCalledWith(file));
    expect(screen.getByRole("status")).toHaveTextContent(
      "Nothing was uploaded"
    );
    clickButton(/^Edit photo 1:/);
    expect(screen.getByLabelText("Horizontal crop")).toBeVisible();
    expect(
      screen.queryByRole("button", { name: "Snapshot" })
    ).not.toBeInTheDocument();
    clickButton("Look");
    expect(screen.getByRole("button", { name: "Court Pop" })).toHaveAttribute(
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
    expect(screen.getByText("8/8 Going")).toBeVisible();
    expect(screen.getByText("Full · waitlist open")).toBeVisible();
    expect(
      screen.queryByRole("button", { name: "Who’s in?" })
    ).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Share Story" })).toBeEnabled();

    rerender(<RecapShareCard {...baseProps} phase="live" courtCount={3} />);
    clickButton("We’re playing");
    expect(screen.getByText("1 completed match")).toBeVisible();
    expect(screen.getByText("3 planned courts")).toBeVisible();
    expect(screen.getByRole("button", { name: "Match pulse" })).toBeEnabled();
    expect(screen.getByRole("button", { name: "Share Story" })).toBeEnabled();
    expect(screen.queryByText("Van")).not.toBeInTheDocument();
  });
});

describe("photo-memory entry", () => {
  it("starts with a Scrapbook photo placeholder and visible attachment action", () => {
    const { container } = render(<RecapShareCard {...baseProps} />);
    expect(container.querySelector("[data-story-theme]")).toHaveAttribute(
      "data-story-theme",
      "scrapbook"
    );
    openStoryDetails();
    expect(screen.getByRole("button", { name: "Your story" })).toHaveAttribute(
      "aria-pressed",
      "true"
    );
    expect(
      screen.getByRole("button", { name: "Add your photo to this memory" })
    ).toBeVisible();
    clickButton("Photos");
    expect(screen.getByRole("button", { name: "Add photos" })).toBeVisible();
    expect(screen.getByRole("button", { name: "Share Story" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Download PNG" })).toBeDisabled();
    expect(screen.queryByText("Customize story")).not.toBeInTheDocument();
  });

  it("reveals extra stories on demand and keeps the selected extra story visible", () => {
    render(<RecapShareCard {...baseProps} />);
    openStoryDetails();
    const choices = screen.getByRole("group", { name: "Story focus options" });
    expect(within(choices).getAllByRole("button")).toHaveLength(4);
    expect(
      screen.queryByRole("button", { name: "Points played" })
    ).not.toBeInTheDocument();
    clickButton("More stories");
    clickButton("Points played");
    clickButton("Fewer stories");
    expect(
      screen.getByRole("button", { name: "Points played" })
    ).toHaveAttribute("aria-pressed", "true");
    expect(within(choices).getAllByRole("button")).toHaveLength(5);
    expect(
      screen.queryByRole("button", { name: "Court time" })
    ).not.toBeInTheDocument();
  });

  it("collapses photo options without losing the selected photo or caption", () => {
    render(
      <RecapShareCard
        {...baseProps}
        photos={[{ id: "crew", url: "/crew.jpg", alt: "Our crew" }]}
      />
    );
    openStoryDetails();
    fireEvent.change(screen.getByLabelText("Your caption"), {
      target: { value: "Saturday crew" },
    });
    clickButton("Add your photo");
    clickButton("Use Our crew");
    clickButton("Layout");
    expect(
      screen.queryByRole("button", { name: "Remove photo" })
    ).not.toBeInTheDocument();
    clickButton("Photos");
    expect(
      screen.getByRole("button", { name: /^Edit photo 1:/ })
    ).toBeVisible();
    clickButton("Details");
    expect(screen.getByLabelText("Your caption")).toHaveValue("Saturday crew");
    expect(screen.getByRole("button", { name: "Share Story" })).toBeEnabled();
  });

  it("uses an existing game photo without resetting the chosen theme, and returns to the placeholder on removal", () => {
    render(
      <RecapShareCard
        {...baseProps}
        photos={[{ id: "crew", url: "/crew.jpg", alt: "Our crew" }]}
      />
    );
    clickButton("Coquette");
    expect(
      screen.queryByRole("button", { name: "Use Our crew" })
    ).not.toBeInTheDocument();
    clickButton("Add your photo");
    clickButton("Use Our crew");
    expect(
      screen.queryByRole("button", { name: "Add your photo to this memory" })
    ).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Share Story" })).toBeEnabled();
    clickButton("Look");
    expect(screen.getByRole("button", { name: "Coquette" })).toHaveAttribute(
      "aria-pressed",
      "true"
    );
    clickButton("Remove photo");
    expect(
      screen.getByRole("button", { name: "Add your photo to this memory" })
    ).toBeVisible();
    clickButton("Look");
    expect(screen.getByRole("button", { name: "Coquette" })).toHaveAttribute(
      "aria-pressed",
      "true"
    );
    expect(screen.getByRole("button", { name: "Share Story" })).toBeDisabled();
  });
});

import { describe, expect, it, vi } from "vitest";

import {
  drawFramedInvitation,
  framedInvitationLayout,
  wrapStoryCopy,
} from "./story-framed-invitation";
import { storyJoinGeometry } from "./story-join";
import { storyThemes } from "./story-theme";

const copy = {
  title: "Sun night 0",
  date: "Sunday, September 13 · 7:15 PM–11:30 PM",
  venue: "3rd Fitness Lab",
  invitation: {
    hostName: "vanajvanguardia",
    goingCount: 1,
    capacity: 16,
    requiresApproval: true,
    waitlistOpen: false,
    priceLabel: "Price not set",
  },
  customNote: "",
};
const preview = 384 / 1080;

describe("framed invitation readable allocation", () => {
  it.each([
    "Free",
    "Price not set",
    "Player share pending",
    "₱125.25 per player",
    "₱125.25 per player · Current player share",
  ])("preserves the complete price disclosure: %s", (priceLabel) => {
    const layout = framedInvitationLayout({
      ...copy,
      invitation: { ...copy.invitation, priceLabel },
      theme: "minimal",
      placement: "center",
      joinMode: "qr",
      template: "invitation",
    });
    expect(
      layout.blocks.find((block) => block.id === "price")!.lines.join(" ")
    ).toBe(priceLabel);
  });
  for (const { id: theme } of storyThemes) {
    for (const placement of ["top", "center", "bottom"] as const) {
      for (const joinMode of ["qr", "link", "off"] as const) {
        it.each(["invitation", "spots"] as const)(
          `${theme}/${placement}/${joinMode}/%s uses full-width compact facts without compounded scaling`,
          (template) => {
            const layout = framedInvitationLayout({
              ...copy,
              theme,
              placement,
              joinMode,
              template,
            });
            const { scene, blocks } = layout;
            expect(storyJoinGeometry(joinMode).scale).toBe(1);
            expect(layout.factor).toBe(1);
            expect(scene.facts.width * preview).toBeGreaterThan(330);
            expect(scene.frame!.width * preview).toBeGreaterThan(330);
            expect(scene.frame!.height * preview).toBeGreaterThanOrEqual(170);
            expect(
              blocks.find(
                (block) =>
                  block.id === (template === "spots" ? "headline" : "title")
              )!.size * preview
            ).toBeGreaterThan(25);
            for (const id of [
              "schedule",
              "location",
              "availability",
              "price",
            ]) {
              expect(
                blocks.find((block) => block.id === id)!.size * preview
              ).toBeGreaterThan(12.79);
            }
            for (const block of blocks) {
              expect(block.x).toBe(72);
              const bottom = block.y + block.height;
              expect(bottom).toBeLessThanOrEqual(
                storyJoinGeometry(joinMode).footer.y - 32
              );
              expect(
                bottom <= scene.frame!.y ||
                  block.y >= scene.frame!.y + scene.frame!.height + 32
              ).toBe(true);
            }
            if (placement === "center") {
              expect(scene.heading).not.toBeNull();
              expect(
                scene.frame!.y - scene.heading!.y - scene.heading!.height
              ).toBeGreaterThanOrEqual(32);
              expect(
                scene.frame!.y - scene.heading!.y - scene.heading!.height
              ).toBeLessThan(240);
            } else {
              expect(scene.heading).toBeNull();
              expect(scene.frame!.y < scene.facts.y).toBe(placement === "top");
            }
          }
        );
      }
    }
  }

  it.each(["top", "center", "bottom"] as const)(
    "reflows long names, locations and captions at %s instead of shrinking a canonical poster",
    (placement) => {
      for (const joinMode of ["qr", "link", "off"] as const) {
        for (const template of ["invitation", "spots"] as const) {
          const input = {
            ...copy,
            title: "Saturday doubles with our Cebu crew",
            venue: "Community Pickleball Courts, Banilad Road, Cebu City",
            customNote:
              "Bring your paddle and stay for a few friendly games with us.",
            theme: "scrapbook" as const,
            placement,
            joinMode,
            template,
          };
          const layout = framedInvitationLayout(input);
          expect(layout.factor).toBeGreaterThanOrEqual(0.88);
          for (const id of ["schedule", "location", "availability", "price"]) {
            expect(
              layout.blocks.find((block) => block.id === id)!.size * preview
            ).toBeGreaterThan(11.2);
          }
          for (const [id, text] of [
            ["title", input.title],
            ["location", input.venue],
            ["note", input.customNote],
          ]) {
            const block = layout.blocks.find((entry) => entry.id === id)!;
            expect(block.lines.join(" ")).toBe(text);
            expect(block.y + block.height).toBeLessThanOrEqual(
              storyJoinGeometry(joinMode).footer.y - 32 + 0.001
            );
          }
          expect(layout.scene.frame!.height).toBeGreaterThanOrEqual(479.999);
        }
      }
    }
  );

  it("retains unbroken and multilingual copy, including captions beyond the ordinary budget", () => {
    const longName = "W".repeat(200);
    expect(wrapStoryCopy(longName, 36).join("")).toBe(longName);
    const note = "友達とピックルボール ".repeat(60).trim();
    const layout = framedInvitationLayout({
      ...copy,
      title: longName,
      customNote: note,
      theme: "minimal",
      placement: "center",
      joinMode: "qr",
      template: "spots",
    });
    expect(
      layout.blocks.find((block) => block.id === "note")!.lines.join(" ")
    ).toBe(note);
    expect(
      layout.blocks.find((block) => block.id === "title")!.lines.join("")
    ).toBe(longName);
    expect(layout.scene.frame!.height).toBeGreaterThanOrEqual(479.999);
    expect(
      layout.blocks.at(-1)!.y + layout.blocks.at(-1)!.height
    ).toBeLessThanOrEqual(1504.001);
    // Finite portrait: extreme copy is preserved, not promised a minimum size.
    expect(layout.factor).toBeLessThan(0.88);
  });

  it("draws precisely the preview's line positions, sizes and complete values without Canvas maxWidth compression", () => {
    const layout = framedInvitationLayout({
      ...copy,
      customNote: "See you on court!",
      theme: "scrapbook",
      placement: "center",
      joinMode: "qr",
      template: "spots",
    });
    const drawn: Array<{ text: string; x: number; y: number; font: string }> =
      [];
    const context = {
      save: vi.fn(),
      restore: vi.fn(),
      font: "",
      fillText(text: string, x: number, y: number) {
        drawn.push({ text, x, y, font: this.font });
      },
    };
    drawFramedInvitation(
      context as unknown as CanvasRenderingContext2D,
      layout,
      "#fff",
      "#aaa"
    );
    expect(drawn).toEqual(
      layout.blocks.flatMap((block) =>
        block.lines.map((text, index) => ({
          text,
          x: 72,
          y: block.baseline + index * block.size * 1.25,
          font: `${block.weight} ${block.size}px Inter, Arial, sans-serif`,
        }))
      )
    );
  });
});

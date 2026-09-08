import { describe, expect, it, vi } from "vitest";

import { drawFramedInvitation } from "./story-framed-invitation";
import { storyInvitationLayout } from "./story-invitation-layout";
import { storyJoinGeometry } from "./story-join";
import { storyThemes } from "./story-theme";

const copy = {
  title: "Sun Night",
  date: "Sunday, September 13 · 12:00 AM–1:15 AM",
  venue: "3rd Fitness Lab",
  invitation: {
    hostName: "vanajvanguardia",
    goingCount: 3,
    capacity: 8,
    requiresApproval: false,
    waitlistOpen: false,
    priceLabel: "₱1,111",
  },
  customNote: "",
  placement: "center" as const,
};

describe("nonframed footer-aware invitation rows", () => {
  for (const { id: theme } of storyThemes) {
    it.each(["invitation", "spots"] as const)(
      `${theme}/%s translates ordinary copy without scaling type, width or artwork`,
      (template) => {
        const off = storyInvitationLayout({
          ...copy,
          theme,
          template,
          joinMode: "off",
        });
        for (const joinMode of ["qr", "link", "off"] as const) {
          const layout = storyInvitationLayout({
            ...copy,
            theme,
            template,
            joinMode,
          });
          const bottom = Math.min(
            1810,
            storyJoinGeometry(joinMode).footer.y - 32
          );
          expect(layout.factor).toBe(1);
          expect(layout.scene.facts.x).toBe(72);
          expect(layout.scene.facts.width).toBe(936);
          expect(layout.scene.art).toEqual(off.scene.art);
          expect(layout.scene.photo).toEqual(off.scene.photo);
          expect(
            layout.blocks.find(
              (block) =>
                block.id === (template === "spots" ? "headline" : "title")
            )!.size
          ).toBe(88);
          expect(
            layout.blocks.find((block) => block.id === "schedule")!.size
          ).toBe(36);
          for (const [index, block] of layout.blocks.entries()) {
            const original = off.blocks[index];
            expect(block.x).toBe(original.x);
            expect(block.size).toBe(original.size);
            expect(block.weight).toBe(original.weight);
            expect(block.lines).toEqual(original.lines);
            expect(block.baseline - original.baseline).toBeCloseTo(
              bottom - 1810
            );
            expect(block.y).toBeGreaterThanOrEqual(
              theme === "minimal" ? 160 : 680
            );
            expect(block.y + block.height).toBeLessThanOrEqual(bottom + 0.001);
          }
          expect(
            layout.blocks.at(-1)!.y + layout.blocks.at(-1)!.height
          ).toBeCloseTo(bottom);
        }
      }
    );
  }

  it("only rewraps overflow copy after exhausting the art-safe region, preserving complete words and captions", () => {
    const title = "W".repeat(200);
    const customNote = "Bring your friends and paddles. ".repeat(20).trim();
    const layout = storyInvitationLayout({
      ...copy,
      title,
      customNote,
      theme: "court-pop",
      template: "spots",
      joinMode: "qr",
    });
    expect(layout.factor).toBeLessThan(1);
    expect(
      layout.blocks.find((block) => block.id === "title")!.lines.join("")
    ).toBe(title);
    expect(
      layout.blocks.find((block) => block.id === "note")!.lines.join(" ")
    ).toBe(customNote);
    for (const block of layout.blocks) {
      expect(block.x).toBe(72);
      expect(block.y).toBeGreaterThanOrEqual(680);
      expect(block.y + block.height).toBeLessThanOrEqual(1504.001);
    }
    expect(layout.scene.art).toEqual({
      x: 72,
      y: 160,
      width: 936,
      height: 480,
    });
  });

  it("draws shared full-width baselines and fonts with no Canvas maxWidth or transforms", () => {
    const layout = storyInvitationLayout({
      ...copy,
      theme: "retro-rally",
      template: "invitation",
      joinMode: "qr",
    });
    const drawn: Array<{ text: string; x: number; y: number; font: string }> =
      [];
    const context = {
      save: vi.fn(),
      restore: vi.fn(),
      fillRect: vi.fn(),
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
          x: block.x,
          y: block.baseline + index * block.size * 1.25,
          font: `${block.weight} ${block.size}px Inter, Arial, sans-serif`,
        }))
      )
    );
  });
});

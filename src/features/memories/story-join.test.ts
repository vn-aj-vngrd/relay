import { describe, expect, it, vi } from "vitest";

import {
  drawStoryJoin,
  storyJoinGeometry,
  storyJoinPalette,
  storyJoinText,
} from "./story-join";
import { storyScene } from "./story-scene";
import { storyThemes } from "./story-theme";

const url = `https://relay.example/s/${"saturday-night-with-friends-".repeat(3)}123abc`;

describe("reserved Story join geometry", () => {
  it.each([
    ["qr", 1, 384, 1080, 1536],
    ["link", 1, 192, 1080, 1728],
    ["off", 1, 0, 1080, 1920],
  ] as const)(
    "allocates %s composition without distorting photos",
    (mode, scale, height, width, bottom) => {
      const geometry = storyJoinGeometry(mode);
      expect(geometry.scale).toBe(scale);
      expect(geometry.footer.height).toBe(height);
      expect(geometry.content.width).toBe(width);
      expect(geometry.content.height).toBe(1920);
      expect(geometry.footer.y).toBe(bottom);
    }
  );

  it.each(["qr", "link", "off"] as const)(
    "keeps framed %s in canonical coordinates without changing the scan field",
    (mode) => {
      const framed = storyJoinGeometry(mode);
      const background = storyJoinGeometry(mode);
      expect(framed.scale).toBe(1);
      expect(framed.content).toEqual({ x: 0, y: 0, width: 1080, height: 1920 });
      expect(framed.footer).toEqual(background.footer);
      expect(framed.qr).toEqual({ x: 72, y: 1584, width: 288, height: 288 });
    }
  );

  it("removes only the display scheme, retaining the host, port and complete path", () => {
    expect(
      storyJoinText(
        "http://localhost:3002/s/sat-night-eb34e7",
        "link"
      ).lines.join("")
    ).toBe("localhost:3002/s/sat-night-eb34e7");
  });

  it.each(storyThemes)(
    "uses selected scene colors for $id, not a detached white strip",
    () => {
      expect(storyJoinPalette({ color: "#0f766e" })).toEqual({
        background: "#0f766e",
        foreground: "#ffffff",
      });
      expect(storyJoinPalette({ color: "#ffe0eb", light: true })).toEqual({
        background: "#ffe0eb",
        foreground: "#17181d",
      });
      expect(storyJoinPalette({ imageUrl: "/court.png", light: true })).toEqual(
        { background: "#11131a", foreground: "#ffffff" }
      );
    }
  );

  for (const theme of storyThemes) {
    it.each(["top", "center", "bottom"] as const)(
      `${theme.id} keeps the full photo and facts above the footer at %s`,
      (placement) => {
        for (const role of ["background", "foreground"] as const) {
          for (const hasPhoto of [true, false]) {
            const scene = storyScene(
              theme.id,
              hasPhoto,
              role,
              placement,
              true,
              { bottom: storyJoinGeometry("qr").footer.y - 32 }
            );
            expect(scene.fitFacts).toBe(true);
            for (const region of [
              scene.facts,
              scene.art,
              ...(scene.framed ? [scene.photo] : []),
            ]) {
              expect(region.y + region.height).toBeLessThanOrEqual(
                storyJoinGeometry("qr").footer.y - 32
              );
            }
            if (!scene.framed)
              expect(scene.photo).toEqual({
                x: 0,
                y: 0,
                width: 1080,
                height: 1920,
              });
          }
        }
      }
    );
  }

  it.each(["qr", "link"] as const)(
    "wraps the full manual destination without ellipsis for %s",
    (mode) => {
      const text = storyJoinText(url, mode);
      expect(text.lines.join("")).toBe(url.replace(/^https?:\/\//, ""));
      expect(text.fontSize).toBeGreaterThan(0);
      expect(text.y + text.lines.length * text.lineHeight).toBeLessThanOrEqual(
        1920
      );
    }
  );

  it("draws a plain 288px QR without covering the composition", () => {
    const context = {
      save: vi.fn(),
      restore: vi.fn(),
      fillRect: vi.fn(),
      drawImage: vi.fn(),
      fillText: vi.fn(),
    };
    const qr = {} as HTMLCanvasElement;
    drawStoryJoin(
      context as unknown as CanvasRenderingContext2D,
      { url, mode: "qr" },
      qr
    );
    expect(context.fillRect).toHaveBeenCalledWith(0, 1536, 1080, 384);
    expect(context.drawImage).toHaveBeenCalledWith(qr, 72, 1584, 288, 288);
    expect(context.fillText).toHaveBeenCalledWith(
      "Scan to view and RSVP",
      408,
      1608
    );
    expect(storyJoinGeometry("qr").content.height).toBe(
      1920 * storyJoinGeometry("qr").scale
    );
    expect(storyJoinGeometry("qr").content.width).toBe(
      1080 * storyJoinGeometry("qr").scale
    );
  });

  it("refuses to silently drop a missing QR but allows explicit link only", () => {
    const context = {
      save: vi.fn(),
      restore: vi.fn(),
      fillRect: vi.fn(),
      drawImage: vi.fn(),
      fillText: vi.fn(),
    };
    expect(() =>
      drawStoryJoin(context as unknown as CanvasRenderingContext2D, {
        url,
        mode: "qr",
      })
    ).toThrow("Story QR is not ready");
    drawStoryJoin(context as unknown as CanvasRenderingContext2D, {
      url,
      mode: "link",
    });
    expect(context.drawImage).not.toHaveBeenCalled();
    expect(context.fillText).toHaveBeenCalledWith(
      "View the game and RSVP",
      72,
      1758
    );
  });
});

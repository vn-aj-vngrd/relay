import { afterEach, describe, expect, it, vi } from "vitest";

import { decodeStoryPhoto, drawStoryPhoto } from "./story-photo";
import { storyScene } from "./story-scene";

afterEach(() => vi.unstubAllGlobals());

describe("Story photo export", () => {
  it("exports an independently zoomed crop inside its collage slot", async () => {
    const bitmap = { width: 1000, height: 500, close: vi.fn() };
    vi.stubGlobal("createImageBitmap", vi.fn().mockResolvedValue(bitmap));
    const context = {
      save: vi.fn(),
      beginPath: vi.fn(),
      rect: vi.fn(),
      clip: vi.fn(),
      drawImage: vi.fn(),
      restore: vi.fn(),
    };
    await drawStoryPhoto(
      context as unknown as CanvasRenderingContext2D,
      new Blob(),
      1080,
      1920,
      50,
      { x: 100, y: 200, width: 500, height: 500 },
      { x: 100, y: 0, zoom: 2 }
    );
    expect(context.rect).toHaveBeenCalledWith(100, 200, 500, 500);
    expect(context.drawImage).toHaveBeenCalledWith(
      bitmap,
      -1400,
      200,
      2000,
      1000
    );
    expect(context.restore).toHaveBeenCalledOnce();
    expect(bitmap.close).toHaveBeenCalledOnce();
  });

  it("decodes a local File directly without fetching its preview URL", async () => {
    const file = new File(["synthetic photo"], "court.png", {
      type: "image/png",
    });
    const bitmap = { width: 1000, height: 2000, close: vi.fn() };
    const decode = vi.fn().mockResolvedValue(bitmap);
    const fetchPhoto = vi
      .fn()
      .mockRejectedValue(new TypeError("CSP blocks blob fetch"));
    vi.stubGlobal("createImageBitmap", decode);
    vi.stubGlobal("fetch", fetchPhoto);
    const drawImage = vi.fn();

    await drawStoryPhoto(
      { drawImage } as unknown as CanvasRenderingContext2D,
      file,
      1080,
      1920,
      75
    );

    expect(fetchPhoto).not.toHaveBeenCalled();
    expect(decode).toHaveBeenCalledWith(file);
    expect(drawImage).toHaveBeenCalledWith(bitmap, 0, -180, 1080, 2160);
    expect(bitmap.close).toHaveBeenCalledOnce();
  });

  it.each(["top", "center", "bottom"] as const)(
    "clips and crops the original File inside the %s foreground window",
    async (placement) => {
      const bitmap = { width: 1000, height: 2000, close: vi.fn() };
      const decode = vi.fn().mockResolvedValue(bitmap);
      vi.stubGlobal("createImageBitmap", decode);
      const fetchPhoto = vi.fn();
      vi.stubGlobal("fetch", fetchPhoto);
      const context = {
        save: vi.fn(),
        beginPath: vi.fn(),
        rect: vi.fn(),
        clip: vi.fn(),
        drawImage: vi.fn(),
        restore: vi.fn(),
      };
      const box = storyScene("scrapbook", true, "foreground", placement).photo;
      const file = new File(["photo"], "court.png");
      await drawStoryPhoto(
        context as unknown as CanvasRenderingContext2D,
        file,
        1080,
        1920,
        75,
        box
      );
      expect(context.rect).toHaveBeenCalledWith(
        box.x,
        box.y,
        box.width,
        box.height
      );
      expect(context.clip).toHaveBeenCalledOnce();
      expect(context.drawImage).toHaveBeenCalledWith(
        bitmap,
        box.x,
        box.y - (box.width * 2 - box.height) * 0.75,
        box.width,
        box.width * 2
      );
      expect(decode).toHaveBeenCalledWith(file);
      expect(fetchPhoto).not.toHaveBeenCalled();
      expect(context.restore).toHaveBeenCalledOnce();
      expect(bitmap.close).toHaveBeenCalledOnce();
    }
  );

  it("still fetches session photos and rejects unavailable responses before decoding", async () => {
    const decode = vi.fn();
    const fetchPhoto = vi.fn().mockResolvedValue({ ok: false });
    vi.stubGlobal("createImageBitmap", decode);
    vi.stubGlobal("fetch", fetchPhoto);

    await expect(
      decodeStoryPhoto("https://example.supabase.co/photo.png")
    ).rejects.toThrow("Selected photo unavailable");
    expect(decode).not.toHaveBeenCalled();
  });

  it("releases the decoded bitmap even when drawing fails", async () => {
    const close = vi.fn();
    vi.stubGlobal(
      "createImageBitmap",
      vi.fn().mockResolvedValue({ width: 2, height: 2, close })
    );
    const context = {
      drawImage: () => {
        throw new Error("Canvas unavailable");
      },
    };
    await expect(
      drawStoryPhoto(
        context as unknown as CanvasRenderingContext2D,
        new Blob(),
        1080,
        1920,
        50
      )
    ).rejects.toThrow("Canvas unavailable");
    expect(close).toHaveBeenCalledOnce();
  });
});

it.each([0, 50, 100])(
  "moves a landscape photo horizontally at crop %i in preview-equivalent cover geometry",
  async (position) => {
    const bitmap = { width: 2000, height: 1000, close: vi.fn() };
    vi.stubGlobal("createImageBitmap", vi.fn().mockResolvedValue(bitmap));
    const context = {
      save: vi.fn(),
      beginPath: vi.fn(),
      rect: vi.fn(),
      clip: vi.fn(),
      drawImage: vi.fn(),
      restore: vi.fn(),
    };
    const bounds = { x: 40, y: 200, width: 1000, height: 1000 };
    await drawStoryPhoto(
      context as unknown as CanvasRenderingContext2D,
      new Blob(),
      1080,
      1920,
      position,
      bounds
    );
    expect(context.drawImage).toHaveBeenCalledWith(
      bitmap,
      40 - (1000 * position) / 100,
      200,
      2000,
      1000
    );
    expect(context.clip).toHaveBeenCalledOnce();
    expect(bitmap.close).toHaveBeenCalledOnce();
  }
);

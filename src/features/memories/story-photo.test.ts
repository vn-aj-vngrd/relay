import { afterEach, describe, expect, it, vi } from "vitest";

import { decodeStoryPhoto, drawStoryPhoto } from "./story-photo";

afterEach(() => vi.unstubAllGlobals());

describe("Story photo export", () => {
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
